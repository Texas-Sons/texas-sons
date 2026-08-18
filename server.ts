import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

import express from "express";
import path from "path";
import fs from "fs/promises";
import * as archiver from "archiver";
import { createServer as createViteServer } from "vite";
import { Octokit } from "@octokit/rest";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Initialize Octokit (GitHub API) lazily
  let octokitClient: Octokit | null = null;
  function getOctokit(): Octokit {
    if (!octokitClient) {
      const token = process.env.GITHUB_ACCESS_TOKEN;
      if (!token) {
        throw new Error("GITHUB_ACCESS_TOKEN environment variable is required");
      }
      octokitClient = new Octokit({ auth: token });
    }
    return octokitClient;
  }

  // Initialize Stripe lazily
  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
      }
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  }

  // Sample API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Provisioning & Template Generation Engine
  app.post("/api/provision", async (req, res) => {
    try {
      const { templateId, versionId, configOverrides } = req.body;
      if (!templateId || !versionId) {
        return res.status(400).json({ success: false, error: "templateId and versionId are required" });
      }

      // 1. Read the manifest
      const manifestPath = path.join(process.cwd(), 'public', 'templates', templateId, 'manifest.json');
      let manifestStr = '';
      try {
        manifestStr = await fs.readFile(manifestPath, 'utf8');
      } catch (err) {
        return res.status(404).json({ success: false, error: `Manifest not found for template ${templateId}` });
      }
      const manifest = JSON.parse(manifestStr);

      // 2. Merge user overrides with default config
      const finalConfig = {
        tokens: { ...manifest.defaultConfig.tokens, ...(configOverrides?.tokens || {}) },
        theme: { ...manifest.defaultConfig.theme, ...(configOverrides?.theme || {}) },
        seo: { ...manifest.defaultConfig.seo, ...(configOverrides?.seo || {}) }
      };

      // 3. Setup zip archiver
      res.attachment(`${templateId}-${versionId}.zip`);
      const archive = (archiver as any).default('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => { throw err; });
      archive.pipe(res);

      // 4. Helper to process HTML files
      const processHtml = async (sourceHtmlName: string, destHtmlName: string) => {
        const filePath = path.join(process.cwd(), 'public', 'templates', templateId, sourceHtmlName);
        let html = '';
        try {
          html = await fs.readFile(filePath, 'utf8');
        } catch (e) {
          return; // File might not exist (e.g. mobile version missing)
        }

        // Replace {{TOKENS}}
        for (const [key, value] of Object.entries(finalConfig.tokens)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          html = html.replace(regex, value as string);
        }

        // Inject SEO
        const seoBlock = `\n  <!-- Generated Meta Tags -->\n  <title>${finalConfig.seo.title}</title>\n  <meta name="description" content="${finalConfig.seo.description}">\n`;
        html = html.replace('</title>', `</title>${seoBlock}`);

        archive.append(html, { name: destHtmlName });
      };

      // 5. Resolve actual filenames from manifest versions map
      const versionFiles = manifest.versions?.[versionId];
      const desktopFile = versionFiles?.desktop || `${versionId}-desktop.html`;
      const mobileFile = versionFiles?.mobile || `${versionId}-mobile.html`;

      await processHtml(desktopFile, 'index.html');
      await processHtml(mobileFile, 'mobile.html');

      // Include admin dashboard as an add-on if requested
      const includeAdmin = req.body.includeAdmin !== false; // default true
      if (includeAdmin && templateId !== 'universal-admin') {
        const adminPath = path.join(process.cwd(), 'public', 'templates', 'admin', 'universal-admin.html');
        try {
          let adminHtml = await fs.readFile(adminPath, 'utf8');
          // Inject shared site tokens into admin too
          for (const [key, value] of Object.entries(finalConfig.tokens)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            adminHtml = adminHtml.replace(regex, value as string);
          }
          archive.append(adminHtml, { name: 'admin/index.html' });
        } catch (e) { /* silent ignore if admin file missing */ }
      }

      await archive.finalize();

    } catch (error: any) {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  });

  // Invoice Generation Route
  app.post("/api/invoice", async (req, res) => {
    try {
      const { amount, clientName } = req.body;
      const stripe = getStripe();
      
      // 1. Create a customer in Stripe
      const customer = await stripe.customers.create({
        name: clientName,
      });

      // 2. Create an invoice item (Stripe expects the amount in cents)
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: Math.round(amount * 100), 
        currency: 'usd',
        description: 'Web Design and Development Services',
      });

      // 3. Create the actual invoice
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 14,
      });

      res.json({ 
        success: true, 
        message: `Successfully generated invoice for ${clientName}.`,
        invoiceId: invoice.id,
        invoiceUrl: invoice.hosted_invoice_url
      });
    } catch (error: any) {
      console.error("Stripe Invoice Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Proposal Route
  app.post("/api/proposal", async (req, res) => {
    try {
      const { businessName, businessAddress, typeOfBusiness } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Write a professional, concise web design and development proposal for a local business.
      
Business Details:
- Name: ${businessName}
- Address: ${businessAddress}
- Type: ${typeOfBusiness}

We are Texas Sons, a premium digital agency. We offer three tiers:
1. Spur (Static) - $1,500: Landing pages, clean design.
2. Ranger (Flow) - $3,500: CMS, dynamic content.
3. Maverick (Engine) - $7,500: Full-stack applications.

Draft a short, persuasive email proposal recommending we build them a modern website to capture more local traffic and elevate their brand. Keep it professional, not overly salesy, and highlight that we noticed they do not currently have a website listed on Google. Make it around 3-4 paragraphs.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

      res.json({ success: true, proposal: response.text });
    } catch (error: any) {
      console.error("AI Proposal Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
