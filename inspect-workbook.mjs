import { read, utils } from 'xlsx';
const workbook = read(
  'data/Esquema-de-Vacunacion-Colombia-PAI-Vacunas-Acelulares-Tarifas-y-Puntos-de-Atencion-387851.xlsx',
  { cellDates: true },
);
console.log(workbook.SheetNames);
for (const name of workbook.SheetNames) {
  console.log('\nSHEET:', name);
  console.log(
    utils.sheet_to_json(workbook.Sheets[name], { defval: null }).slice(0, 8),
  );
}
