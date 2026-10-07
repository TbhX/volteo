export function brandMatches(brand, dealer) {
 const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const tokens = normalize((dealer.brands || '') + ' ' + dealer.name).split(/[^a-z0-9]+/);
 const aliases = {Volkswagen:['volkswagen','vw'],Citroën:['citroen'],Škoda:['skoda'],Mercedes:['mercedes'],DS:['ds'],MINI:['mini'],Mini:['mini']};
 return (aliases[brand] || [normalize(brand)]).some(alias => tokens.includes(alias));
}
export function routeUrl(item, place) {
 const query = new URLSearchParams({api:'1',destination:item.lat+','+item.lon,travelmode:'driving'});
 if(place)query.set('origin',place.lat+','+place.lon);
 return 'https://www.google.com/maps/dir/?'+query;
}
