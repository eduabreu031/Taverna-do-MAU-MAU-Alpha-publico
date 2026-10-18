// Protótipo de integração isolada da v84. Usar somente no menu Multiplayer.
// Não importa o GameEngine nem reescreve o DOM da mesa original.
// O script completo e testado está no arquivo DEV disponibilizado na conversa.
export const MULTIPLAYER_ENDPOINT = 'https://taverna-multiplayer-servidor.edulopes941.workers.dev';
export const MULTIPLAYER_PROTOCOL = Object.freeze({create:'/api/room',roomWs:code=>'/api/room/'+code+'/ws'});
export function validRoomCode(value){return /^[A-HJ-NP-Z2-9]{6}$/.test(String(value||'').trim().toUpperCase());}
