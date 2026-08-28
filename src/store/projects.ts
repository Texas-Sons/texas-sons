import { supabase } from '../supabase';
import { Project, Invoice } from '../types';
import { getOwnerId, requireOwnerId, readCache, writeCache } from './core';

/**
 * Projects and invoices.
 *
 * The snake_case <-> camelCase mapping used to live inline in App.tsx and was
 * duplicated (differently) in ProjectProposalModal. It lives here now so there is
 * one definition of what a project row looks like.
 */

const PROJECTS_CACHE_KEY = 'txsons_projects';
const INVOICES_CACHE_KEY = 'txsons_invoices';

function rowToProject(row: any): Project {
  return {
    id: row.id,
    clientName: row.client_name,
    companyName: row.company_name,
    tier: row.tier,
    status: row.status,
    updatedAt: row.updated_at,
    domain: row.domain,
    ownerId: row.owner_id,
    blueprint: row.blueprint,
  };
}

function projectToRow(project: Project, ownerId: string) {
  return {
    id: project.id,
    owner_id: ownerId,
    company_name: project.companyName,
    client_name: project.clientName,
    status: project.status,
    tier: project.tier,
    domain: project.domain,
    blueprint: project.blueprint,
    updated_at: new Date().toISOString(),
  };
}

function rowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    projectId: row.project_id,
    clientName: row.client_name,
    amount: row.amount,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    ownerId: row.owner_id,
  };
}

// --- projects ---------------------------------------------------------------

export async function listProjects(): Promise<Project[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<Project[]>(PROJECTS_CACHE_KEY, []);

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('[store] Projects read failed, serving cache:', error);
    return readCache<Project[]>(PROJECTS_CACHE_KEY, []);
  }

  const projects = (data || []).map(rowToProject);
  writeCache(PROJECTS_CACHE_KEY, projects);
  return projects;
}

export async function saveProject(project: Project): Promise<void> {
  if (!project?.id) throw new Error('Project needs an id before it can be saved.');
  const ownerId = await requireOwnerId();

  const cached = readCache<Project[]>(PROJECTS_CACHE_KEY, []);
  const exists = cached.some(p => p.id === project.id);
  writeCache(
    PROJECTS_CACHE_KEY,
    exists ? cached.map(p => (p.id === project.id ? project : p)) : [project, ...cached]
  );

  const { error } = await supabase.from('projects').upsert(projectToRow(project, ownerId));
  if (error) {
    console.error('[store] Project save failed:', error);
    throw new Error(error.message || 'Could not save the project.');
  }
}

export async function removeProject(id: string): Promise<void> {
  const ownerId = await requireOwnerId();

  writeCache(
    PROJECTS_CACHE_KEY,
    readCache<Project[]>(PROJECTS_CACHE_KEY, []).filter(p => p.id !== id)
  );

  const { error } = await supabase.from('projects').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) {
    console.error('[store] Project delete failed:', error);
    throw new Error(error.message || 'Could not delete the project.');
  }
}

export function cachedProjects(): Project[] {
  return readCache<Project[]>(PROJECTS_CACHE_KEY, []);
}

// --- invoices ---------------------------------------------------------------

export async function listInvoices(): Promise<Invoice[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<Invoice[]>(INVOICES_CACHE_KEY, []);

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('owner_id', ownerId)
    .order('issue_date', { ascending: false });

  if (error) {
    console.warn('[store] Invoices read failed, serving cache:', error);
    return readCache<Invoice[]>(INVOICES_CACHE_KEY, []);
  }

  const invoices = (data || []).map(rowToInvoice);
  writeCache(INVOICES_CACHE_KEY, invoices);
  return invoices;
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  const ownerId = await requireOwnerId();

  const { error } = await supabase.from('invoices').insert({
    id: invoice.id,
    owner_id: ownerId,
    project_id: invoice.projectId,
    client_name: invoice.clientName,
    amount: invoice.amount,
    status: invoice.status,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
  });
  if (error) {
    console.error('[store] Invoice save failed:', error);
    throw new Error(error.message || 'Could not save the invoice.');
  }
}
