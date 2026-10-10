import {publicPages} from './public-content.js';
export function siteOrigin(value=''){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash?u.origin:'';}catch{return '';}}
export const routeMetadata={
 '/':['VOLTÉO — Explorez votre projet de voiture électrique','De la curiosité au projet : besoins, recharge, budget et modèles adaptés. Préparez votre échange avec une concession autour des Ulis.'],
 '/catalogue':['Catalogue de voitures électriques | VOLTÉO','Comparez autonomie, recharge et budget des modèles électriques. Données indicatives à confirmer.'],
 '/comparateur':['Comparateur de voitures électriques | VOLTÉO','Comparez votre sélection selon votre usage, votre budget et vos possibilités de recharge.'],
 '/simulateur':['Simulateur de coût thermique et électrique | VOLTÉO','Comparez vos dépenses à l’usage et le coût complet du passage à l’électrique. Hypothèses modifiables, gains et surcoûts expliqués.'],
 '/diagnostic':['Quel électrique pour mon usage ? | VOLTÉO','Identifiez les critères utiles à votre choix de voiture électrique.'],
 '/guides':['Guides voiture électrique | VOLTÉO','Comprendre le budget, la recharge et préparer un essai de voiture électrique.'],
 '/recharge':['Planifier sa recharge électrique | VOLTÉO','Préparez votre recharge : borne à domicile, coût de pose, aides selon le logement, pilotage et piste solaire. Hypothèses et sources datées.'],
 '/partenaires':['Devenir partenaire VOLTÉO','Accompagnez les automobilistes dans leur transition électrique : projets préparés, demandes choisies par les acheteurs et suivi des essais.'],
 '/pilote':['Pilote électrique autour des Ulis | VOLTÉO','Découvrez le pilote VOLTÉO et préparez votre passage à l’électrique.'],
 '/sources':['Sources et limites des données | VOLTÉO','Consultez la provenance et la fraîcheur des informations présentées.']
};
export const appPaths=['/',...Object.keys(routeMetadata).filter(x=>x!=='/'),'/passeport','/projet','/offres-locales','/stock','/autour-de-moi','/credits-photos','/connexion','/compte','/professionnel','/parametres','/admin','/admin/gestion','/tableau-de-bord','/confidentialite','/mentions-legales','/conditions'];
export function metadata(path,origin='',vehicles=[]){
 const p=path.replace(/\/+$/,'')||'/';const page=publicPages[p];const vehicle=vehicles.find(v=>p==='/vehicules/'+v.slug);
 const entry=page?[page.title+' | VOLTÉO',page.description]:routeMetadata[p]||(vehicle?[`${vehicle.brand} ${vehicle.model} : fiche électrique | VOLTÉO`,'Caractéristiques indicatives et comparaison avec votre usage. Prix et données à confirmer auprès du professionnel.']:null);
 const known=!!entry||appPaths.includes(p);const privatePage=!entry;
 // Catalogue demonstrative: don't index individual unverified model pages.
 const indexable=!!origin&&!privatePage&&!vehicle;
 return{path:p,title:entry?.[0]||(known?'Votre espace | VOLTÉO':'Page introuvable | VOLTÉO'),description:entry?.[1]||'Votre espace personnel VOLTÉO.',canonical:entry&&origin?origin+p:'',robots:indexable?'index,follow,max-image-preview:large':'noindex,follow',known};
}
export function structuredData(path,origin){const page=publicPages[path];if(!origin||!page)return null;return{'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'VOLTÉO',inLanguage:'fr-FR'},{'@type':'WebPage','@id':origin+path+'#webpage',url:origin+path,name:page.title,description:page.description,inLanguage:'fr-FR',isPartOf:{'@id':origin+'/#website'},breadcrumb:{'@id':origin+path+'#breadcrumb'}},{'@type':'BreadcrumbList','@id':origin+path+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:'VOLTÉO',item:origin+'/'},{'@type':'ListItem',position:2,name:page.title,item:origin+path}]}]};}
