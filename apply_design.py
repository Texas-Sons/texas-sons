import re

file_path = r'c:\Users\Morgan\OneDrive\Documents\Texas Sons\src\components\ProspectsView.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Colors and general replacements
replacements = {
    'bg-orange-600 hover:bg-orange-500 text-white': 'bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black',
    'bg-orange-600 text-white': 'bg-[#C5A059]/90 text-stone-950 font-black',
    'bg-orange-600': 'bg-[#C5A059]/90',
    'text-orange-500': 'text-[#C5A059]',
    'text-orange-400': 'text-[#C5A059]',
    'text-orange-300': 'text-[#C5A059]',
    'border-orange-500': 'border-[#C5A059]/60',
    'ring-orange-500': 'ring-[#C5A059]/20',
    'shadow-orange-600/30': 'shadow-[#C5A059]/30',
    'shadow-orange-600/20': 'shadow-[#C5A059]/20',
    
    'bg-amber-600 text-white': 'bg-[#C5A059]/90 text-stone-950 font-black',
    'bg-amber-600': 'bg-[#C5A059]/90',
    'text-amber-400': 'text-[#C5A059]',
    'text-amber-300': 'text-[#C5A059]',
    'bg-amber-500/20': 'bg-[#C5A059]/20',
    'bg-amber-500/30': 'bg-[#C5A059]/30',
    'border-amber-500/30': 'border-[#C5A059]/30',
    'border-amber-500/40': 'border-[#C5A059]/40',
    'shadow-amber-500/5': 'shadow-[#C5A059]/5',
    'shadow-amber-600/30': 'shadow-[#C5A059]/30',
    
    'bg-emerald-400': 'text-emerald-400',
    'text-white': 'text-stone-100',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Page Layout & Header
content = content.replace(
    '<div className="flex-1 overflow-y-auto">',
    '<div className="flex-1 overflow-y-auto bg-stone-950 text-stone-100 bg-[radial-gradient(circle,_#2a2a2a_1px,_transparent_1px)] bg-[length:24px_24px]">'
)

content = content.replace(
    '<div className="max-w-6xl mx-auto p-8">',
    '<div className="max-w-6xl mx-auto pb-8">'
)

# Header block
content = content.replace(
    '''<div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-100">Lead Finder</h1>
            <p className="text-stone-400 mt-1">Search Google Maps for specific businesses or companies without websites to prospect.</p>
          </div>''',
    '''<div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between mb-4 border-b border-stone-800/50 bg-stone-950/80 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold text-stone-100">Lead Finder</h1>
            <p className="text-xs font-mono text-stone-500 mt-1">Search Google Maps for specific businesses or companies without websites to prospect.</p>
          </div>'''
)

# Subheadings
content = content.replace(
    'text-xs font-bold text-stone-500 uppercase tracking-wider',
    'text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono'
)

# Card pods styling
content = content.replace(
    'bg-stone-900 border ${filterTab === \'hidden\' ? \'border-stone-800 opacity-70\' : isSaved ? \'border-[#C5A059]/40 shadow-lg shadow-[#C5A059]/5\' : \'border-stone-800\'} rounded-xl p-6',
    'bg-stone-900 border ${filterTab === \'hidden\' ? \'border-stone-800 opacity-70\' : isSaved ? \'border-[#C5A059]/40 shadow-lg shadow-[#C5A059]/5\' : \'border-stone-800\'} rounded-2xl p-6'
)

# Form section needs to have the new input class and padding
content = re.sub(
    r'className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-\[#C5A059\]/60 focus:ring-1 focus:ring-\[#C5A059\]/20 transition-colors text-sm"',
    'className="bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600 w-full py-3 pl-12 pr-4 transition-colors text-sm font-mono"',
    content
)
content = re.sub(
    r'className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-9 pr-3 text-stone-100 focus:outline-none focus:border-\[#C5A059\]/60 focus:ring-1 focus:ring-\[#C5A059\]/20 transition-colors appearance-none text-sm"',
    'className="bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600 w-full py-3 pl-9 pr-3 transition-colors appearance-none text-sm font-mono"',
    content
)

# Fix px-4 on form wrapper to align with header
content = content.replace(
    '<form onSubmit={handleSearch} className="mb-10 grid grid-cols-1 md:grid-cols-12 gap-3">',
    '<form onSubmit={handleSearch} className="mb-10 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-3">'
)

content = content.replace(
    '<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">',
    '<div className="px-4 sm:px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">'
)

# Card icon pods
content = content.replace(
    '<div className="inline-block px-2.5 py-1 rounded-md bg-stone-800 text-xs text-stone-300 font-medium mb-2">',
    '<div className="inline-block px-2.5 py-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 text-xs text-[#C5A059] font-mono mb-2">'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
