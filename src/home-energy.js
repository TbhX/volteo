export const energyStudyDefaults={housing:'unknown',tenure:'unknown',parking:'unknown',daytime:'unknown',solar:'unknown',quote:'',aid:'',aidConfirmed:false};
export function energyOrientation(p){
 if(p.housing==='unknown'||p.parking==='unknown')return {title:'Précisons votre logement et votre stationnement.',body:'Ces informations permettent de distinguer installation individuelle, projet collectif et recharge extérieure.',advenir:false,solar:'Renseignez votre logement pour explorer la piste solaire.'};
 if(p.parking==='no')return {title:'Préparer une recharge hors de votre domicile.',body:'Sans place dédiée, ne prévoyez pas encore de travaux individuels. Étudiez les solutions au travail, les parkings équipés et les bornes publiques.',advenir:false,solar:'Sans toiture personnelle, une opération locale d’autoconsommation collective peut être une piste pour le logement. Elle ne garantit pas une recharge solaire de la voiture.'};
 const collective=p.housing==='flat';
 return {title:collective?'Étudier la recharge dans votre immeuble.':'Faire évaluer votre installation à domicile.',body:collective?'Demandez au syndic ou au bailleur si une infrastructure existe déjà, puis comparez raccordement, pose, abonnement et tarif de recharge.':'Faites vérifier le tableau, le cheminement du câble et la puissance réellement nécessaire par un installateur qualifié IRVE.',advenir:collective,solar:p.solar==='installed'?'Vous avez déjà des panneaux : demandez si la recharge peut suivre le surplus réel de production.':collective?'Explorez un projet solaire avec la copropriété ou une opération locale d’autoconsommation collective. L’appartement n’exclut pas le solaire.':p.tenure==='owner'?'Une étude de toiture peut être pertinente : exposition, ombrage, état du toit et consommation du foyer restent à vérifier.':'Avant une étude de toiture, clarifiez le projet avec le propriétaire. Le logement seul ne permet pas de conclure à sa faisabilité.'};
}
export function installationBudget(p){
 if(p.quote===''||p.quote==null)return null;
 const quote=Number(p.quote),aid=p.aidConfirmed?Number(p.aid||0):0;
 if(!Number.isFinite(quote)||quote<0||!Number.isFinite(aid)||aid<0||aid>quote)return null;
 return {quote,aid,net:quote-aid};
}
