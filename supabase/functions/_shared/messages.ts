export type NotificationMessage={id:string;category:string;title:string;body:string;targetUrl:string;preferredPeriod?:string}
export const messages:NotificationMessage[]=[
 {id:'welcome-01',category:'welcome',title:'Método LEVE',body:'🌿 Que bom que você chegou. Seu primeiro passo já foi dado.',targetUrl:'/app'},
 {id:'motivation-01',category:'motivation',title:'Método LEVE',body:'🌿 Hoje é um ótimo dia para cuidar de você.',targetUrl:'/app',preferredPeriod:'morning'},
 {id:'motivation-02',category:'motivation',title:'Método LEVE',body:'Você não precisa fazer tudo. Só precisa começar.',targetUrl:'/app'},
 {id:'hydration-01',category:'hydration',title:'Método LEVE',body:'💧 Já bebeu água hoje?',targetUrl:'/app/diario?focus=water'},
 {id:'hydration-02',category:'hydration',title:'Método LEVE',body:'Um copo de água agora já é uma pequena vitória.',targetUrl:'/app/diario?focus=water'},
 {id:'exercise-01',category:'exercise',title:'Método LEVE',body:'🏃 Seu movimento de hoje está esperando.',targetUrl:'/app/exercicios?day=current'},
 {id:'journal-01',category:'journal',title:'Método LEVE',body:'📝 Como foi seu dia? Reserve um momento para você.',targetUrl:'/app/diario?focus=reflection'},
 {id:'self-esteem-01',category:'selfEsteem',title:'Método LEVE',body:'❤️ Seja gentil consigo hoje.',targetUrl:'/app/diario'},
 {id:'achievement-01',category:'achievement',title:'Método LEVE',body:'🎉 Uma nova conquista está quase chegando.',targetUrl:'/app/progresso?tab=achievements'},
 {id:'reengagement-01',category:'reengagement',title:'Método LEVE',body:'Hoje pode ser um bom dia para recomeçar.',targetUrl:'/app'},
]
