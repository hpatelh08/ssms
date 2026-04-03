const fs = require('fs');
let f = 'E:/intership/Std 4/Std 4/child/ChildLayout.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/export type ChildScreen = .*?;/g, "export type ChildScreen = 'home' | 'play' | 'odd-one-out' | 'word-builder' | 'journey' | 'garden' | 'color-magic';");
fs.writeFileSync(f, c);
