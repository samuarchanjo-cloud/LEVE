export type Period='morning'|'afternoon'|'evening'
export type DailyCategory='motivation'|'hydration-pending'|'hydration-maintenance'|'food-pending'|'food-completed'|'movement-pending'|'movement-completed'|'journal-pending'|'sleep'|'self-esteem'|'reflection'|'celebration'|'recipe'|'streak'
export type MessageCondition='water-pending'|'water-started'|'food-pending'|'food-completed'|'movement-pending'|'movement-completed'|'journal-pending'|'journal-completed'|'streak'
export type NotificationMessage={id:string;period?:Period;category:string;title:string;body:string;targetUrl:string;conditions?:MessageCondition[]}
const m=(id:string,period:Period,category:DailyCategory,body:string,targetUrl='/app',conditions:MessageCondition[]=[]):NotificationMessage=>({id,period,category,title:'Método LEVE',body,targetUrl,conditions})

export const welcomeMessage:NotificationMessage={id:'welcome-01',category:'welcome',title:'Método LEVE',body:'🌿 Que bom que você chegou. Seu primeiro passo já foi dado.',targetUrl:'/app'}
export const legacyMessages:NotificationMessage[]=[
 {id:'motivation-01',category:'motivation',title:'Método LEVE',body:'🌿 Hoje é um ótimo dia para cuidar de você.',targetUrl:'/app'},
 {id:'motivation-02',category:'motivation',title:'Método LEVE',body:'Você não precisa fazer tudo. Só precisa começar.',targetUrl:'/app'},
 {id:'hydration-01',category:'hydration',title:'Método LEVE',body:'💧 Já bebeu água hoje?',targetUrl:'/app/diario?focus=water'},
 {id:'hydration-02',category:'hydration',title:'Método LEVE',body:'Um copo de água agora já é uma pequena vitória.',targetUrl:'/app/diario?focus=water'},
 {id:'exercise-01',category:'exercise',title:'Método LEVE',body:'🏃 Seu movimento de hoje está esperando.',targetUrl:'/app/exercicios?day=current'},
 {id:'journal-01',category:'journal',title:'Método LEVE',body:'📝 Como foi seu dia? Reserve um momento para você.',targetUrl:'/app/diario?focus=reflection'},
 {id:'self-esteem-01',category:'selfEsteem',title:'Método LEVE',body:'❤️ Seja gentil consigo hoje.',targetUrl:'/app/diario'},
 {id:'achievement-01',category:'achievement',title:'Método LEVE',body:'🎉 Uma nova conquista está quase chegando.',targetUrl:'/app/progresso?tab=achievements'},
 {id:'reengagement-01',category:'reengagement',title:'Método LEVE',body:'Hoje pode ser um bom dia para recomeçar.',targetUrl:'/app'},
]

export const dailyMessages:NotificationMessage[]=[
 m('morning-motivation-01','morning','motivation','🌿 Bom dia. Hoje não precisa ser perfeito, só precisa começar.'),
 m('morning-motivation-02','morning','motivation','☀️ Um novo dia começou. Vá no seu ritmo e cuide do próximo passo.'),
 m('morning-motivation-03','morning','motivation','🌱 Pequenos hábitos também constroem grandes mudanças.'),
 m('morning-motivation-04','morning','motivation','💚 Que hoje você consiga se tratar com mais gentileza.'),
 m('morning-motivation-05','morning','motivation','🌿 Comece devagar. O importante é continuar presente.'),
 m('morning-motivation-06','morning','motivation','☀️ Escolha uma pequena coisa para fazer por você hoje.'),
 m('morning-motivation-07','morning','motivation','🌱 Sua rotina não precisa mudar de uma vez. Um passo já importa.'),
 m('morning-motivation-08','morning','motivation','🌿 Respire fundo. Você não precisa carregar o dia inteiro de uma só vez.'),
 m('morning-motivation-09','morning','motivation','💚 Seu ritmo também merece respeito.'),
 m('morning-motivation-10','morning','motivation','🌱 Faça o possível de hoje. Isso já será suficiente.'),
 m('morning-water-01','morning','hydration-pending','💧 Comece o dia oferecendo água ao seu corpo.','/app/diario?focus=water',['water-pending']),
 m('morning-water-02','morning','hydration-pending','💧 Um copo de água pode ser a primeira pequena vitória de hoje.','/app/diario?focus=water',['water-pending']),
 m('morning-water-03','morning','hydration-pending','🌿 Antes da correria começar, lembre-se de se hidratar.','/app/diario?focus=water',['water-pending']),
 m('morning-water-04','morning','hydration-pending','💧 Água por perto torna o cuidado mais fácil.','/app/diario?focus=water',['water-pending']),
 m('morning-movement-01','morning','movement-pending','🏃 Seu corpo não precisa de pressa. Precisa de movimento possível.','/app/exercicios?day=current',['movement-pending']),
 m('morning-movement-02','morning','movement-pending','🌿 Alguns minutos de movimento já podem mudar a energia do seu dia.','/app/exercicios?day=current',['movement-pending']),
 m('morning-movement-03','morning','movement-pending','🚶 Caminhe no seu ritmo. O importante é colocar o corpo em movimento.','/app/exercicios?day=current',['movement-pending']),
 m('morning-selfesteem-01','morning','self-esteem','💚 Hoje, fale consigo como falaria com alguém que ama.','/app/diario?focus=self-esteem'),

 m('afternoon-food-pending-01','afternoon','food-pending','🥗 Já fez uma pausa para se alimentar com calma?','/app/diario?focus=food',['food-pending']),
 m('afternoon-food-pending-02','afternoon','food-pending','🌿 No meio da correria, seu corpo também precisa de atenção.','/app/diario?focus=food',['food-pending']),
 m('afternoon-food-pending-03','afternoon','food-pending','🍽️ Comer com presença também é uma forma de autocuidado.','/app/diario?focus=food',['food-pending']),
 m('afternoon-food-pending-04','afternoon','food-pending','🥗 Que sua próxima refeição seja um momento de cuidado, não de culpa.','/app/diario?focus=food',['food-pending']),
 m('afternoon-food-done-01','afternoon','food-completed','🌿 Que bom que você cuidou da sua alimentação hoje.','/app/diario?focus=food',['food-completed']),
 m('afternoon-food-done-02','afternoon','food-completed','🥗 Você já fez uma escolha por você. Continue ouvindo seu corpo.','/app/diario?focus=food',['food-completed']),
 m('afternoon-food-done-03','afternoon','food-completed','💚 Cuidar da alimentação sem culpa também é progresso.','/app/diario?focus=food',['food-completed']),
 m('afternoon-water-pending-01','afternoon','hydration-pending','💧 Já bebeu água nesta parte do dia?','/app/diario?focus=water',['water-pending']),
 m('afternoon-water-pending-02','afternoon','hydration-pending','💧 Seu corpo agradece esse próximo copo.','/app/diario?focus=water',['water-pending']),
 m('afternoon-water-pending-03','afternoon','hydration-pending','🌿 Deixe a água por perto e torne o cuidado mais fácil.','/app/diario?focus=water',['water-pending']),
 m('afternoon-water-maintain-01','afternoon','hydration-maintenance','💧 Você já começou bem. Mantenha sua água por perto.','/app/diario?focus=water',['water-started']),
 m('afternoon-water-maintain-02','afternoon','hydration-maintenance','🌿 Continue se hidratando aos poucos durante a tarde.','/app/diario?focus=water',['water-started']),
 m('afternoon-water-maintain-03','afternoon','hydration-maintenance','💧 Seu corpo precisa de hidratação ao longo do dia, não apenas uma vez.','/app/diario?focus=water',['water-started']),
 m('afternoon-movement-pending-01','afternoon','movement-pending','🏃 Seu movimento de hoje está pronto quando você estiver.','/app/exercicios?day=current',['movement-pending']),
 m('afternoon-movement-pending-02','afternoon','movement-pending','🚶 Alguns minutos podem mudar a energia da sua tarde.','/app/exercicios?day=current',['movement-pending']),
 m('afternoon-movement-done-01','afternoon','movement-completed','🌿 Você já movimentou seu corpo hoje. Reconheça essa vitória.','/app/exercicios?day=current',['movement-completed']),
 m('afternoon-movement-done-02','afternoon','movement-completed','💚 Seu corpo recebeu um pouco do cuidado que merece.','/app/exercicios?day=current',['movement-completed']),
 m('afternoon-reflection-01','afternoon','reflection','🌿 Faça uma pausa curta. Seu corpo não é uma máquina.'),
 m('afternoon-reflection-02','afternoon','reflection','☁️ Respire fundo antes de continuar.'),
 m('afternoon-reflection-03','afternoon','reflection','🌱 Nem toda pausa é atraso. Algumas são cuidado.'),
 m('afternoon-recipe-01','afternoon','recipe','🥗 Que tal uma receita simples e colorida para hoje?','/app/receitas/{recipeId}'),
 m('afternoon-recipe-02','afternoon','recipe','🍳 Uma refeição leve pode ser prática e saborosa.','/app/receitas/{recipeId}'),
 m('afternoon-recipe-03','afternoon','recipe','🌿 Nutrir-se também pode ser prazeroso.','/app/receitas/{recipeId}'),

 m('evening-journal-01','evening','journal-pending','📝 Como foi seu dia? Reserve algumas palavras para você.','/app/diario?focus=reflection',['journal-pending']),
 m('evening-journal-02','evening','journal-pending','🌿 Antes de dormir, reconheça algo bom que aconteceu hoje.','/app/diario?focus=reflection',['journal-pending']),
 m('evening-journal-03','evening','journal-pending','📝 Seu Diário LEVE está esperando por algumas linhas.','/app/diario?focus=reflection',['journal-pending']),
 m('evening-journal-04','evening','journal-pending','🌙 Registrar seu dia também é uma forma de desacelerar.','/app/diario?focus=reflection',['journal-pending']),
 m('evening-sleep-01','evening','sleep','🌙 Seu corpo também evolui quando descansa.','/app/diario?focus=sleep'),
 m('evening-sleep-02','evening','sleep','😴 Desacelere aos poucos. O dia já pode terminar.','/app/diario?focus=sleep'),
 m('evening-sleep-03','evening','sleep','🌿 Dormir bem também faz parte da sua jornada.','/app/diario?focus=sleep'),
 m('evening-sleep-04','evening','sleep','💚 Descansar não é perder tempo. É cuidar do próximo dia.','/app/diario?focus=sleep'),
 m('evening-selfesteem-01','evening','self-esteem','❤️ Seja gentil consigo antes de encerrar o dia.','/app/diario?focus=self-esteem'),
 m('evening-selfesteem-02','evening','self-esteem','💚 Você merece o mesmo carinho que oferece aos outros.','/app/diario?focus=self-esteem'),
 m('evening-selfesteem-03','evening','self-esteem','🌿 Seu valor não depende de um dia perfeito.','/app/diario?focus=self-esteem'),
 m('evening-reflection-01','evening','reflection','🌿 O que deixou seu dia um pouco mais leve?','/app/diario?focus=reflection'),
 m('evening-reflection-02','evening','reflection','💭 Qual pequena escolha de hoje fez bem para você?','/app/diario?focus=reflection'),
 m('evening-reflection-03','evening','reflection','🌙 Você não precisa avaliar o dia apenas pelo que faltou.','/app/diario?focus=reflection'),
 m('evening-celebration-01','evening','celebration','🎉 Você cuidou de si hoje. Isso merece ser reconhecido.','/app/progresso'),
 m('evening-celebration-02','evening','celebration','🌱 Mais um dia construindo hábitos no seu ritmo.','/app/progresso'),
 m('evening-celebration-03','evening','celebration','💚 Cada pequena ação de hoje fez parte da sua jornada.','/app/progresso'),
 m('evening-celebration-04','evening','celebration','✨ Seu esforço de hoje também conta.','/app/progresso'),
 m('evening-streak-01','evening','streak','🔥 Você está há {streak} dias cuidando de você.','/app/progresso',['streak']),
 m('evening-streak-02','evening','streak','🌱 Sua constância chegou a {streak} dias.','/app/progresso',['streak']),
]

export const fallbackMessages:NotificationMessage[]=[
 m('fallback-morning-01','morning','motivation','🌿 Reserve um pequeno momento para você.'),
 m('fallback-morning-02','morning','motivation','💚 Hoje também pode ter um passo leve.'),
 m('fallback-afternoon-01','afternoon','reflection','🌱 Seu próximo cuidado não precisa ser grande.'),
 m('fallback-afternoon-02','afternoon','reflection','✨ Pequenas escolhas continuam contando.'),
 m('fallback-evening-01','evening','reflection','🌿 Vá no seu ritmo. Viva LEVE.'),
 m('fallback-evening-02','evening','self-esteem','💛 Você merece presença, não pressão.'),
]

export const messages=[welcomeMessage,...legacyMessages,...dailyMessages,...fallbackMessages]
