'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ALL_SELECTIONS = [
  { category: 'Structural & Foundation', items: [
    { name: 'Foundation Type', description: 'Slab, crawl space, or basement', due_phase: 'Pre-Construction', requires_signoff: true },
    { name: 'Concrete Finish', description: 'Garage and patio concrete texture/finish', due_phase: 'Foundation', requires_signoff: false },
    { name: 'Waterproofing System', description: 'Foundation waterproofing method', due_phase: 'Foundation', requires_signoff: true },
  ]},
  { category: 'Exterior', items: [
    { name: 'Roof Shingle Color & Style', description: 'Architectural or designer shingles', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Exterior Siding Material', description: 'Brick, stone, stucco, hardie, wood, etc.', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Exterior Siding Color', description: 'Primary siding color', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Exterior Trim Color', description: 'Fascia, soffit, and trim colors', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Front Door Style & Color', description: 'Entry door design and finish', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Garage Door Style', description: 'Panel style, windows, color', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Window Style & Color', description: 'Frame color and grille pattern', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Gutters & Downspouts', description: 'Color and material', due_phase: 'Rough Framing', requires_signoff: false },
  ]},
  { category: 'Plumbing Fixtures & Finishes', items: [
    { name: 'Plumbing Fixture Finish', description: 'Chrome, brushed nickel, matte black, gold, etc.', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Kitchen Faucet', description: 'Style and finish', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Kitchen Sink', description: 'Material, size, and configuration', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Master Bath Faucets', description: 'Style and finish', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Master Bath Shower Fixtures', description: 'Showerhead, valves, hand spray', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Master Bath Tub', description: 'Freestanding, soaking, or jetted', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Secondary Bath Faucets', description: 'Style and finish', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Secondary Bath Shower Fixtures', description: 'Showerhead and valve', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Toilets', description: 'Style, height, flush type', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Laundry Utility Sink', description: 'If applicable', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Outdoor Hose Bibs', description: 'Quantity and location', due_phase: 'Rough MEP', requires_signoff: false },
  ]},
  { category: 'Electrical & Lighting', items: [
    { name: 'Electrical Panel Location', description: 'Panel placement and size', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Recessed Lighting Layout', description: 'Can light placement per room', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Pendant Light Locations', description: 'Island, dining, and accent pendants', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Ceiling Fan Locations', description: 'Rooms with ceiling fans', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Under Cabinet Lighting', description: 'Kitchen and work areas', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Exterior Lighting', description: 'Porch, garage, and landscape lights', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Switch & Outlet Finish', description: 'White, ivory, black, or custom plates', due_phase: 'Finishes', requires_signoff: false },
    { name: 'USB Outlet Locations', description: 'Built-in USB charging outlets', due_phase: 'Rough MEP', requires_signoff: false },
  ]},
  { category: 'HVAC & Mechanical', items: [
    { name: 'HVAC System Type', description: 'Central air, mini-split, geothermal', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Thermostat Type', description: 'Smart or standard thermostat', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Vent Register Style', description: 'Floor, wall, or ceiling registers and finish', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Water Heater Type', description: 'Tankless, tank, hybrid', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Fireplace Type & Style', description: 'Gas, wood, electric — surround style', due_phase: 'Rough MEP', requires_signoff: true },
  ]},
  { category: 'Insulation & Drywall', items: [
    { name: 'Insulation Type', description: 'Batt, spray foam, blown-in', due_phase: 'Insulation & Drywall', requires_signoff: true },
    { name: 'Drywall Finish Level', description: 'Level 3, 4, or 5 finish', due_phase: 'Insulation & Drywall', requires_signoff: true },
    { name: 'Ceiling Texture', description: 'Smooth, knockdown, orange peel, skip trowel', due_phase: 'Insulation & Drywall', requires_signoff: true },
    { name: 'Accent Wall Locations', description: 'Rooms with special wall treatment', due_phase: 'Insulation & Drywall', requires_signoff: false },
  ]},
  { category: 'Flooring', items: [
    { name: 'Main Level Flooring', description: 'Hardwood, LVP, tile — material and color', due_phase: 'Flooring', requires_signoff: true },
    { name: 'Master Bedroom Flooring', description: 'Carpet, hardwood, or LVP', due_phase: 'Flooring', requires_signoff: true },
    { name: 'Secondary Bedroom Flooring', description: 'Carpet, hardwood, or LVP', due_phase: 'Flooring', requires_signoff: true },
    { name: 'Stair Treads & Risers', description: 'Material and finish', due_phase: 'Flooring', requires_signoff: true },
    { name: 'Master Bath Flooring', description: 'Tile material, size, and pattern', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Secondary Bath Flooring', description: 'Tile material, size, and pattern', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Laundry Room Flooring', description: 'Tile or LVP', due_phase: 'Flooring', requires_signoff: false },
    { name: 'Garage Flooring', description: 'Painted, epoxy, or standard', due_phase: 'Flooring', requires_signoff: false },
  ]},
  { category: 'Cabinetry & Storage', items: [
    { name: 'Kitchen Cabinet Style', description: 'Door style — shaker, flat, raised panel, etc.', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Kitchen Cabinet Color', description: 'Painted color or stain', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Kitchen Cabinet Hardware', description: 'Pulls and knobs — style and finish', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Kitchen Upper Cabinet Height', description: 'Standard or extended to ceiling', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Island Design', description: 'Size, seating, and storage configuration', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Master Bath Vanity Style', description: 'Cabinet style and color', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Master Bath Vanity Hardware', description: 'Pulls and knobs', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Secondary Bath Vanity Style', description: 'Cabinet style and color', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Laundry Cabinets', description: 'Upper and lower cabinet configuration', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Pantry Configuration', description: 'Shelving layout and style', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Master Closet System', description: 'Layout and shelving style', due_phase: 'Cabinets & Countertops', requires_signoff: true },
  ]},
  { category: 'Countertops & Surfaces', items: [
    { name: 'Kitchen Countertop Material', description: 'Quartz, granite, marble, quartzite, etc.', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Kitchen Countertop Color & Slab', description: 'Specific slab selection', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Kitchen Countertop Edge Profile', description: 'Eased, beveled, ogee, waterfall, etc.', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Island Countertop', description: 'Same or contrasting material', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Master Bath Countertop', description: 'Material and color', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Secondary Bath Countertop', description: 'Material and color', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Laundry Countertop', description: 'Material if applicable', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Fireplace Hearth & Surround', description: 'Material and finish', due_phase: 'Cabinets & Countertops', requires_signoff: true },
  ]},
  { category: 'Tile & Backsplash', items: [
    { name: 'Kitchen Backsplash Tile', description: 'Material, size, color, and pattern', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Kitchen Backsplash Layout', description: 'Running bond, herringbone, stack, etc.', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Master Bath Shower Tile — Wall', description: 'Tile material, size, and pattern', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Master Bath Shower Tile — Floor', description: 'Floor tile material and pattern', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Master Bath Shower Niche', description: 'Size, quantity, and tile', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Master Bath Tub Surround', description: 'Tile material and layout', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Secondary Bath Shower Tile', description: 'Wall and floor tile', due_phase: 'Tile & Backsplash', requires_signoff: false },
    { name: 'Grout Color', description: 'All grout colors by location', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Tile Trim & Schluter', description: 'Edge trim style and finish', due_phase: 'Tile & Backsplash', requires_signoff: false },
  ]},
  { category: 'Paint & Wall Finishes', items: [
    { name: 'Interior Paint Color — Main Level', description: 'Walls, ceilings, and trim colors', due_phase: 'Paint', requires_signoff: true },
    { name: 'Interior Paint Color — Bedrooms', description: 'Per room or standard color', due_phase: 'Paint', requires_signoff: true },
    { name: 'Ceiling Color', description: 'White or custom ceiling color', due_phase: 'Paint', requires_signoff: false },
    { name: 'Trim & Door Color', description: 'Interior trim and door paint color', due_phase: 'Paint', requires_signoff: true },
    { name: 'Accent Wall Color', description: 'Feature wall colors per room', due_phase: 'Paint', requires_signoff: false },
    { name: 'Wainscoting & Wall Panels', description: 'Style, height, and location', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Wallpaper Locations', description: 'Rooms and pattern if applicable', due_phase: 'Paint', requires_signoff: false },
  ]},
  { category: 'Trim & Millwork', items: [
    { name: 'Baseboard Style & Height', description: 'Profile and height', due_phase: 'Finishes & Trim', requires_signoff: true },
    { name: 'Door Casing Style', description: 'Interior door trim profile', due_phase: 'Finishes & Trim', requires_signoff: true },
    { name: 'Crown Molding', description: 'Profile and rooms', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Interior Door Style', description: 'Panel style — shaker, etc.', due_phase: 'Finishes & Trim', requires_signoff: true },
    { name: 'Interior Door Hardware', description: 'Knob or lever style and finish', due_phase: 'Finishes & Trim', requires_signoff: true },
    { name: 'Stair Railing System', description: 'Newel posts, balusters, handrail style', due_phase: 'Finishes & Trim', requires_signoff: true },
    { name: 'Built-in Shelving Locations', description: 'Bookcases, mudroom, etc.', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Coffered or Beam Ceilings', description: 'Location and style', due_phase: 'Finishes & Trim', requires_signoff: false },
  ]},
  { category: 'Appliances', items: [
    { name: 'Refrigerator', description: 'Size, style, and finish', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Range / Cooktop', description: 'Gas or electric, size, brand', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Oven / Double Oven', description: 'Built-in or range, single or double', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Range Hood / Ventilation', description: 'Style, size, and finish', due_phase: 'Cabinets & Countertops', requires_signoff: true },
    { name: 'Dishwasher', description: 'Brand and finish', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Microwave', description: 'Built-in, drawer, or over-range', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Washer & Dryer', description: 'Brand, finish, stacking or side-by-side', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Wine / Beverage Fridge', description: 'If applicable', due_phase: 'Cabinets & Countertops', requires_signoff: false },
    { name: 'Ice Maker', description: 'Built-in or undercounter', due_phase: 'Rough MEP', requires_signoff: false },
  ]},
  { category: 'Hardware & Fixtures', items: [
    { name: 'Bath Accessories Finish', description: 'Towel bars, toilet paper holder, robe hooks', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Mirror Style', description: 'Framed or frameless, per bathroom', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Shower Door Style', description: 'Framed, frameless, or bypass', due_phase: 'Tile & Backsplash', requires_signoff: true },
    { name: 'Shower Door Finish', description: 'Chrome, brushed nickel, matte black, etc.', due_phase: 'Tile & Backsplash', requires_signoff: false },
    { name: 'Medicine Cabinet', description: 'Recessed or surface mount', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Mailbox Style', description: 'Post, wall mount, or built-in', due_phase: 'Exterior', requires_signoff: false },
    { name: 'House Numbers Style', description: 'Font and finish', due_phase: 'Exterior', requires_signoff: false },
  ]},
  { category: 'Landscaping & Exterior Finishes', items: [
    { name: 'Driveway Material', description: 'Concrete, asphalt, pavers, or gravel', due_phase: 'Punch List & Final Walk', requires_signoff: true },
    { name: 'Driveway Finish', description: 'Broom, exposed aggregate, stamped', due_phase: 'Punch List & Final Walk', requires_signoff: false },
    { name: 'Front Porch Material', description: 'Concrete, stone, brick, or wood', due_phase: 'Rough Framing', requires_signoff: true },
    { name: 'Back Patio Material', description: 'Concrete, pavers, or wood deck', due_phase: 'Punch List & Final Walk', requires_signoff: true },
    { name: 'Fence Style & Material', description: 'Privacy, picket, or ranch style', due_phase: 'Punch List & Final Walk', requires_signoff: false },
    { name: 'Sod vs Seed', description: 'Lawn establishment method', due_phase: 'Punch List & Final Walk', requires_signoff: true },
    { name: 'Landscape Bed Design', description: 'Plant selections and mulch', due_phase: 'Punch List & Final Walk', requires_signoff: false },
    { name: 'Irrigation System', description: 'Zones and controller type', due_phase: 'Punch List & Final Walk', requires_signoff: false },
    { name: 'Retaining Walls', description: 'Material and location if applicable', due_phase: 'Punch List & Final Walk', requires_signoff: false },
  ]},
  { category: 'Smart Home & Technology', items: [
    { name: 'Home Automation System', description: 'Control4, Lutron, Amazon, Google, Apple Home', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Security System', description: 'Camera locations and panel', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Doorbell Camera', description: 'Brand and style', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Smart Lock', description: 'Keypad or app-controlled locks', due_phase: 'Finishes & Trim', requires_signoff: false },
    { name: 'Structured Wiring / Data Ports', description: 'CAT6 locations per room', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'Surround Sound / Audio', description: 'Speaker locations and system', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'TV Mount Locations', description: 'Blocking and outlet placement', due_phase: 'Rough MEP', requires_signoff: true },
    { name: 'Smart Lighting System', description: 'Lutron Caseta, Leviton, or standard', due_phase: 'Rough MEP', requires_signoff: false },
    { name: 'EV Charger', description: '240V outlet in garage for EV charging', due_phase: 'Rough MEP', requires_signoff: false },
  ]},
]

interface SelectionItem {
  name: string
  description: string
  due_phase: string
  requires_signoff: boolean
  category: string
  sort_order: number
  enabled: boolean
}

export default function NewSelectionTemplatePage() {
  const [name, setName] = useState('New Construction — Master Selections')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<SelectionItem[]>(
    ALL_SELECTIONS.flatMap((cat, ci) =>
      cat.items.map((item, ii) => ({
        ...item,
        category: cat.category,
        sort_order: ci * 100 + ii,
        enabled: true,
      }))
    )
  )
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState(ALL_SELECTIONS[0].category)
  const router = useRouter()
  const supabase = createClient()

  function toggleItem(index: number) {
    setItems(items.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item))
  }

  function toggleCategory(category: string) {
    const catItems = items.filter(i => i.category === category)
    const allEnabled = catItems.every(i => i.enabled)
    setItems(items.map(item => item.category === category ? { ...item, enabled: !allEnabled } : item))
  }

  function updateItem(index: number, field: string, value: any) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: template } = await supabase
      .from('selection_templates')
      .insert({ name, description, created_by: user?.id })
      .select().single()

    if (template) {
      const enabledItems = items.filter(i => i.enabled)
      await supabase.from('selection_template_items').insert(
        enabledItems.map(item => ({
          template_id: template.id,
          category: item.category,
          item_name: item.name,
          description: item.description,
          due_phase: item.due_phase,
          requires_signoff: item.requires_signoff,
          sort_order: item.sort_order,
        }))
      )
      router.push(`/admin/selections/${template.id}`)
    }
    setSaving(false)
  }

  const categories = ALL_SELECTIONS.map(c => c.category)
  const enabledCount = items.filter(i => i.enabled).length
  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '6px', color: '#f5f0e8', fontSize: '13px', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#6a5f50', marginBottom: '6px' }
  const card = { background: '#111111', border: '1px solid rgba(184,151,106,0.12)', borderRadius: '8px' }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/admin/selections" style={{ fontSize: '11px', color: '#4a4030', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>← Selection Templates</Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: '#f5f0e8' }}>New Selection Template</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#6a5f50' }}>{enabledCount} selections enabled</span>
          <button onClick={handleSave} disabled={saving || !name} style={{ padding: '8px 20px', background: '#b8976a', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      <div style={{ ...card, padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Template Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="e.g. Standard new construction selections" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px' }}>
        <div style={{ ...card, overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: '24px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(184,151,106,0.12)' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6a5f50' }}>Categories</p>
          </div>
          {categories.map(cat => {
            const catItems = items.filter(i => i.category === cat)
            const enabledCat = catItems.filter(i => i.enabled).length
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: activeCategory === cat ? 'rgba(184,151,106,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(184,151,106,0.06)', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '12px', color: activeCategory === cat ? '#b8976a' : '#6a5f50' }}>{cat}</span>
                <span style={{ fontSize: '10px', color: enabledCat === catItems.length ? '#70b080' : '#6a5f50' }}>{enabledCat}/{catItems.length}</span>
              </button>
            )
          })}
        </div>

        <div style={card}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#f5f0e8' }}>{activeCategory}</p>
            <button onClick={() => toggleCategory(activeCategory)} style={{ background: 'none', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '4px', color: '#b8976a', cursor: 'pointer', fontSize: '11px', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Toggle All
            </button>
          </div>
          {items.filter(i => i.category === activeCategory).map((item) => {
            const idx = items.indexOf(item)
            return (
              <div key={idx} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(184,151,106,0.06)', opacity: item.enabled ? 1 : 0.4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input type="checkbox" checked={item.enabled} onChange={() => toggleItem(idx)} style={{ marginTop: '3px', accentColor: '#b8976a', width: '16px', height: '16px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#f5f0e8' }}>{item.name}</p>
                      {item.requires_signoff && (
                        <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(184,151,106,0.1)', color: '#b8976a', border: '1px solid rgba(184,151,106,0.2)', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sign-off</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#4a4030', marginBottom: '6px' }}>{item.description}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', color: '#4a4030', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Phase:</span>
                      <input value={item.due_phase} onChange={e => updateItem(idx, 'due_phase', e.target.value)} style={{ padding: '3px 8px', background: '#1a1a1a', border: '1px solid rgba(184,151,106,0.15)', borderRadius: '4px', color: '#b8976a', fontSize: '11px', outline: 'none', width: '180px' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#4a4030', cursor: 'pointer' }}>
                        <input type="checkbox" checked={item.requires_signoff} onChange={e => updateItem(idx, 'requires_signoff', e.target.checked)} style={{ accentColor: '#b8976a' }} />
                        Requires sign-off
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
