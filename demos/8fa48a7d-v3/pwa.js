if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}
document.addEventListener('submit',e=>{const f=e.target;if(!e.defaultPrevented&&!f.getAttribute('action'))e.preventDefault();});
