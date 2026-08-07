// Precision Farming reference data (mod/DLC only, not base FS25). Soil types in a fixed
// column order used across all three tables below.
export const pfSoilTypes = ["Loamy sand", "Sandy loam", "Loam", "Silty clay"];
export const pfSoilProps = {
  "Loamy sand": { ph: 6.00, maxYield: 80 },
  "Sandy loam": { ph: 6.50, maxYield: 100 },
  "Loam":       { ph: 6.75, maxYield: 125 },
  "Silty clay": { ph: 7.00, maxYield: 90 }
};
// target/reduction arrays are in pfSoilTypes order: [Loamy sand, Sandy loam, Loam, Silty clay]
export const pfNitrogen = [
  { crop:"Wheat",         tags:[],                          target:[140,180,200,160], reduction:[140,180,180,160] },
  { crop:"Barley",        tags:[],                          target:[120,160,180,140], reduction:[100,120,160,100] },
  { crop:"Canola",        tags:[],                          target:[140,180,200,160], reduction:[140,160,180,160] },
  { crop:"Oat",           tags:[],                          target:[80,100,140,100],  reduction:[60,80,120,80] },
  { crop:"Corn",  tags:[],                          target:[120,160,200,180], reduction:[100,140,180,140] },
  { crop:"Sunflowers",     tags:[],                          target:[60,80,120,80],    reduction:[40,60,80,60] },
  { crop:"Soybeans",       tags:["OVERFERT","HARVESTFERT"],  target:[0,0,0,0],         reduction:[0,0,0,0] },
  { crop:"Potatoes",        tags:["OVERFERT"],                target:[100,120,160,140], reduction:[80,100,120,120] },
  { crop:"Sugar beet",    tags:["OVERFERT"],                target:[120,140,180,160], reduction:[100,120,140,120] },
  { crop:"Sugarcane",     tags:[],                          target:[120,160,200,180], reduction:[100,140,160,120] },
  { crop:"Cotton",        tags:[],                          target:[80,100,120,100],  reduction:[60,60,100,80] },
  { crop:"Sorghum",       tags:[],                          target:[100,120,160,140], reduction:[80,100,120,120] },
  { crop:"Poplar",        tags:["OVERFERT","HARVESTFERT"],  target:[120,160,180,140], reduction:[100,120,160,120] },
  { crop:"Grass",         tags:["OVERFERT","HARVESTFERT"],  target:[50,55,65,65],     reduction:[40,40,50,55] }
];
// netLeft/over are also in pfSoilTypes order; this table has its own crop list (shares most
// crops with pfNitrogen, plus Oilseed Radish which only appears here).
export const pfHeadroom = [
  { crop:"Wheat",          netLeft:[0,20,20,0],   over:true },
  { crop:"Barley",         netLeft:[0,20,20,20],  over:true },
  { crop:"Oat",            netLeft:[20,20,20,20], over:true },
  { crop:"Canola",         netLeft:[0,20,20,0],   over:true },
  { crop:"Corn",   netLeft:[20,20,20,40], over:true },
  { crop:"Grass",          netLeft:[20,20,20,20], over:true },
  { crop:"Sunflowers",      netLeft:[20,20,20,20], over:true },
  { crop:"Soybeans",        netLeft:[0,0,0,0],     over:false },
  { crop:"Potatoes",         netLeft:[20,20,40,20], over:false },
  { crop:"Sugar beet",     netLeft:[20,20,40,20], over:false },
  { crop:"Cotton",         netLeft:[20,40,20,20], over:true },
  { crop:"Poplar",         netLeft:[20,40,20,20], over:false },
  { crop:"Sugarcane",      netLeft:[20,20,40,20], over:true },
  { crop:"Oilseed Radish", netLeft:[40,40,40,40], over:false }
];
// Vanilla FS25 crop guide - applies with no mods. Gathered from community FS25 guides as a
// starting reference; treat exact yields/prices as approximate.
export const vanillaCrops = [
  { crop:"Wheat",          category:"Grain",     plant:"Sep-Oct", harvest:"Jul-Aug", equipment:"Seeder to plant; combine harvester (grain header) to harvest", price:"$1,011" },
  { crop:"Barley",         category:"Grain",     plant:"Sep-Oct", harvest:"Jun-Jul", equipment:"Seeder to plant; combine harvester (grain header) to harvest", price:"$939" },
  { crop:"Canola",         category:"Grain",     plant:"Aug-Sep", harvest:"Jul-Aug", equipment:"Seeder to plant; combine harvester (grain header) to harvest", price:"$1,809" },
  { crop:"Oat",            category:"Grain",     plant:"Mar-Apr", harvest:"Jul-Aug", equipment:"Seeder to plant; combine harvester (grain header) to harvest", price:"$1,596" },
  { crop:"Sorghum",        category:"Grain",     plant:"Apr-May", harvest:"Aug-Sep", equipment:"Seeder to plant; combine harvester (grain header) to harvest", price:"$1,290" },
  { crop:"Soybeans",        category:"Grain",     plant:"Apr-May", harvest:"Oct-Nov", equipment:"Seeder to plant; combine harvester (grain header) to harvest", price:"$2,334" },
  { crop:"Long Grain Rice",category:"Grain",     plant:"Apr",     harvest:"Sep",     equipment:"Seeder to plant; combine harvester to harvest (no flooding needed)", price:"$1,589" },
  { crop:"Corn",   category:"Grain",     plant:"Apr-May", harvest:"Oct-Nov", equipment:"Precision planter; combine with corn header to harvest", price:"$1,140" },
  { crop:"Sunflowers",      category:"Grain",     plant:"Mar-Apr", harvest:"Oct-Nov", equipment:"Precision planter; combine with sunflower/corn header to harvest", price:"$2,019" },
  { crop:"Potatoes",         category:"Root",      plant:"Mar-Apr", harvest:"Aug-Oct", equipment:"Potato planter; weeder; potato harvester (e.g. Grimme/Ropa)", price:"$516" },
  { crop:"Sugar beet",     category:"Root",      plant:"Mar-Apr", harvest:"Oct-Nov", equipment:"Planter; defoliator; weeder; beet harvester (e.g. Agrifac/HOLMER/Ropa)", price:"$366" },
  { crop:"Red Beet",       category:"Vegetable", plant:"Apr-Jun", harvest:"Aug-Nov", equipment:"Planter; weeder; beet harvester", price:"$366" },
  { crop:"Carrots",        category:"Vegetable", plant:"Apr-Jul", harvest:"Aug-Nov", equipment:"Subsoiler; planter; weeder; Dewulf-type harvester", price:"$396" },
  { crop:"Parsnips",       category:"Vegetable", plant:"Apr-Jun", harvest:"Aug-Oct", equipment:"Subsoiler; planter; weeder; Dewulf-type harvester", price:"$393" },
  { crop:"Onions",         category:"Vegetable", plant:"Mar-Apr", harvest:"Aug-Sep", equipment:"Precision planter; haulm remover; weeder; potato harvester w/ onion head", price:"n/a" },
  { crop:"Green Beans",    category:"Vegetable", plant:"Apr-Jun", harvest:"Aug-Nov", equipment:"Planter; weeder; specialised harvester (e.g. Oxbo)", price:"$2,160" },
  { crop:"Peas",           category:"Vegetable", plant:"Mar-Apr", harvest:"Jul-Sep", equipment:"Seeder; weeder; specialised harvester (e.g. Oxbo)", price:"$3,119" },
  { crop:"Spinach",        category:"Vegetable", plant:"Mar-May", harvest:"year-round", equipment:"Seeder; weeder; specialised harvester (e.g. Oxbo)", price:"$660" },
  { crop:"Rice",           category:"Special",   plant:"Apr-May", harvest:"Aug-Sep", equipment:"Requires a flooded field; dedicated rice planter/harvester", price:"$3,300" },
  { crop:"Sugarcane",      category:"Special",   plant:"Mar-Apr", harvest:"Oct-Nov", equipment:"Dedicated planter; cultivator; weeder; dedicated sugarcane harvester", price:"$357" },
  { crop:"Cotton",         category:"Special",   plant:"Feb-Mar", harvest:"Oct-Nov", equipment:"Planter; weeder; cotton picker; cotton trailer for round modules", price:"$3,756" },
  { crop:"Grapes",         category:"Vineyard",  plant:"planted via build mode", harvest:"Sep-Oct", equipment:"Mulcher; subsoiler; sprayer for upkeep; dedicated grape harvester", price:"$1,809" },
  { crop:"Olives",         category:"Vineyard",  plant:"planted via build mode", harvest:"Oct", equipment:"Mulcher; subsoiler; sprayer for upkeep; dedicated olive harvester", price:"$1,809" },
  { crop:"Poplar",         category:"Forestry",  plant:"Mar-Aug", harvest:"year-round (multi-year)", equipment:"Dedicated tree planter (e.g. Damcon); forestry harvester or biobaler", price:"n/a (wood chips)" },
  { crop:"Grass",          category:"Forage",    plant:"self-regenerating", harvest:"year-round", equipment:"Mower/forage harvester; no replanting needed", price:"n/a" },
  { crop:"Oilseed Radish", category:"Cover crop", plant:"Mar-Oct", harvest:"n/a - not sold", equipment:"Seeder only; cultivated/mulched under rather than harvested", price:"Precision Farming only - see below" }
];
