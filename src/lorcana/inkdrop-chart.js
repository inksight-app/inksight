export const INKDROP_COLORS={stock:'#b49bff',gained:'#34d399',removed:'#fb923c'};

// Preserve each half-turn: resources can change on the opponent's turn too.
// Retirements remain counts, not assumed ink payments or negative stock.
export function inkDropChartModel(timeline){
  const available=Array.isArray(timeline);
  const rows=available?timeline:[];
  const labels=rows.map(row=>['T'+row.turn,row.activeOwner==='mine'?'Vous':'Adv.']);
  return {
    available,
    labels,
    stock:[{label:'Stock',data:rows.map(row=>row.stock),borderColor:INKDROP_COLORS.stock,backgroundColor:'rgba(180,155,255,.10)',fill:true,stepped:'after',borderWidth:2.5,pointRadius:0,pointHoverRadius:4,spanGaps:false}],
    flows:[
      {label:'Gagnées',data:rows.map(row=>row.gained),backgroundColor:INKDROP_COLORS.gained,borderColor:INKDROP_COLORS.gained,borderRadius:3,maxBarThickness:12},
      {label:'Retirées',data:rows.map(row=>row.removed),backgroundColor:INKDROP_COLORS.removed,borderColor:INKDROP_COLORS.removed,borderRadius:3,maxBarThickness:12}
    ]
  };
}
