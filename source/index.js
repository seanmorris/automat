import { Tag } from 'curvature/base/Tag';
import { View } from 'curvature/base/View';
import { Bindable } from 'curvature/base/Bindable';

const cellSize = 8;

const width  = 512 * 0.5;
const height = 288 * 0.5;
const canvas = new Tag(`<canvas width = "${width}" height = "${height}">`).node;
const active = new Tag(`<canvas width = "${width/cellSize}" height = "${height/cellSize}">`).node;

const context    = canvas.getContext('2d');
const activeContext = active.getContext('2d');
const imageData  = new ImageData(width, height);
const activeDataA = new ImageData(width/cellSize, height/cellSize);
const activeDataB = new ImageData(width/cellSize, height/cellSize);

const types = {
	_WATER:   [0x00, 0x55, 0xCC, 0xFF]
	, _HEAVY: [0x00, 0x22, 0x99, 0xFF]
	, _SAND:  [0xEE, 0xAA, 0x00, 0xFF]
	, _OIL:   [0xAA, 0x33, 0x66, 0xFF]
	, _SLIME: [0x00, 0xFF, 0x33, 0xFF]
	, _LAVA:  [0xFF, 0x00, 0x00, 0xFF]
	, _STEAM: [0xAA, 0xAA, 0xCC, 0xFF]
	, _SNOW:  [0xFF, 0xFF, 0xFF, 0xFF]
	, _BLANK: [0xAA, 0xAA, 0xAA, 0xFF]
	, _FIRE:  [0xFF, 0xFF, 0x00, 0xFF]
	, _SMOKE: [0x11, 0x33, 0x11, 0xFF]
	, _SOLID: [0x00, 0x00, 0x00, 0xFF]
	, _BLANK: [0x00, 0x00, 0x00, 0x00]
};

const totals     = Bindable.make({ particles: 0 });
const totalView  = View.from('<div cv-each = "totals:total:name"><div>[[name]]: [[total]]</div></div>', {totals});

let selectedType = types._SAND;

const palletView = View.from('<div class = "pallet" cv-each = "types:type:name"><div><div cv-on = "click(event, type)" class = "typeSelect" data-name = "[[name]]" style = "--type:#[[type|toColor]];"></div></div></div>', {totals});

palletView.toColor = c => c.map(b => b.toString(16).padStart(2, '0')).join('');
palletView.click = (event, type) => selectedType = type;

palletView.args.types = {};

Object.assign(palletView.args.types, types);

const attributes = {
	_WATER:   {isLiquid: true}
	, _HEAVY: {isLiquid: true}
};

const check = (pixels, w, x, y) => {

	if(y < 0 || y > (height - 1) || x < 0 || x > w-1)
	{
		return types._SOLID;
	}

	const i  = 4 * x  + 4 * y * w;

	return pixels.slice(i, i + 4);
}

const pixMatch = (p, c, o = 0) => {
	if(p[0 + o] !== c[0]) return false;
	if(p[1 + o] !== c[1]) return false;
	if(p[2 + o] !== c[2]) return false;
	if(p[3 + o] !== c[3]) return false;
	return true;
}

const pixSet = (activeMask, img, o, p) => {
	img[o + 0] = p[0];
	img[o + 1] = p[1];
	img[o + 2] = p[2];
	img[o + 3] = p[3];

	const x = (o / 4) % width;
	const y = Math.trunc(o / 4 / width);

	setActive(activeMask,width,x,y);
}

const setActive = (activeMask,w,x,y) => {
	const xc =  Math.trunc(x / cellSize);
	const yc =  Math.trunc(y / cellSize);

	const xcMax = Math.trunc(w / cellSize);
	
	const xcl = xc - 1;
	const xcr = xc + 1;
	
	const ycu = yc - 1;
	const ycd = yc + 1;

	const ic  =  4 * xc  + 4 * yc  * xcMax;
	const icl  = 4 * xcl + 4 * yc  * xcMax;
	const icr  = 4 * xcr + 4 * yc  * xcMax;
	const icu  = 4 * xc  + 4 * ycu * xcMax;
	const icd  = 4 * xc  + 4 * ycd * xcMax;

	const iclu = 4 * xcl + 4 * ycu * xcMax;
	const icld = 4 * xcl + 4 * ycd * xcMax;
	const icru = 4 * xcr + 4 * ycu * xcMax;
	const icrd = 4 * xcr + 4 * ycd * xcMax;

	activeMask[ic + 0] = 0xFF;
	activeMask[ic + 1] = 0xFF;
	activeMask[ic + 2] = 0xFF;
	activeMask[ic + 3] = 0xFF;

	activeMask[icu + 0] = activeMask[icu + 0] || 0x80;
	activeMask[icu + 1] = activeMask[icu + 1] || 0x80;
	activeMask[icu + 2] = activeMask[icu + 2] || 0x80;
	activeMask[icu + 3] = activeMask[icu + 3] || 0x80;
	activeMask[icd + 0] = activeMask[icd + 0] || 0x80;
	activeMask[icd + 1] = activeMask[icd + 1] || 0x80;
	activeMask[icd + 2] = activeMask[icd + 2] || 0x80;
	activeMask[icd + 3] = activeMask[icd + 3] || 0x80;

	if(xc > 0)
	{
		activeMask[icl + 0]  = activeMask[icl + 0]  || 0x80;
		activeMask[icl + 1]  = activeMask[icl + 1]  || 0x80;
		activeMask[icl + 2]  = activeMask[icl + 2]  || 0x80;
		activeMask[icl + 3]  = activeMask[icl + 3]  || 0x80;
		activeMask[iclu + 0] = activeMask[iclu + 0] || 0x40;
		activeMask[iclu + 1] = activeMask[iclu + 1] || 0x40;
		activeMask[iclu + 2] = activeMask[iclu + 2] || 0x40;
		activeMask[iclu + 3] = activeMask[iclu + 3] || 0x40;
		activeMask[icld + 0] = activeMask[icld + 0] || 0x40;
		activeMask[icld + 1] = activeMask[icld + 1] || 0x40;
		activeMask[icld + 2] = activeMask[icld + 2] || 0x40;
		activeMask[icld + 3] = activeMask[icld + 3] || 0x40;
	}

	if(xc < -1+xcMax)
	{
		activeMask[icr + 0]  =  activeMask[icr + 0] ||  0x80;
		activeMask[icr + 1]  =  activeMask[icr + 1] ||  0x80;
		activeMask[icr + 2]  =  activeMask[icr + 2] ||  0x80;
		activeMask[icr + 3]  =  activeMask[icr + 3] ||  0x80;
		activeMask[icru + 0] =  activeMask[icru + 0] || 0x40;
		activeMask[icru + 1] =  activeMask[icru + 1] || 0x40;
		activeMask[icru + 2] =  activeMask[icru + 2] || 0x40;
		activeMask[icru + 3] =  activeMask[icru + 3] || 0x40;
		activeMask[icrd + 0] =  activeMask[icrd + 0] || 0x40;
		activeMask[icrd + 1] =  activeMask[icrd + 1] || 0x40;
		activeMask[icrd + 2] =  activeMask[icrd + 2] || 0x40;
		activeMask[icrd + 3] =  activeMask[icrd + 3] || 0x40;
	}
}
const move = (bytes, out, moved, activeMask,  w, x, y, xa, ya) => {
	const i  = 4 * x  + 4 * y  * w;
	const ia = 4 * xa + 4 * ya * w;

	if(xa > w) throw new Error(`x dest out of bounds. (${x})`);
	if(ya > w) throw new Error(`y dest out of bounds. (${x})`);

	if(moved[i]) return;
	if(moved[ia]) return;

	setActive(activeMask,w,x,y);
	setActive(activeMask,w,xa,ya);

	moved[i] = true;
	moved[ia] = true;

	out[ia + 0] = bytes[i + 0];
	out[ia + 1] = bytes[i + 1];
	out[ia + 2] = bytes[i + 2];
	out[ia + 3] = bytes[i + 3];
	
	out[i + 0]  = bytes[ia + 0];
	out[i + 1]  = bytes[ia + 1];
	out[i + 2]  = bytes[ia + 2];
	out[i + 3]  = bytes[ia + 3];

	// bytes[ia + 0] = bytes[i + 0] = 0;
	// bytes[ia + 1] = bytes[i + 1] = 0;
	// bytes[ia + 2] = bytes[i + 2] = 0;
	// bytes[ia + 3] = bytes[i + 3] = 0;
};
const binToName = (r,g,b,a) => {
	return !a ? false : String(r.toString(16).padStart(2, '0')
		+ g.toString(16).padStart(2, '0')
		+ b.toString(16).padStart(2, '0')
		+ a.toString(16).padStart(2, '0')).toUpperCase();
};
const chance = (odds) => Math.random() < odds;
const update = (bytes, w, f) => {

	const activeMask = f % 2 ? activeDataA.data : activeDataB.data;
	const activeMaskPrev = f % 2 ? activeDataB.data : activeDataA.data;
	const _totals = {};
	const out   = new Uint8ClampedArray(bytes);
	const moved = new Uint8ClampedArray(bytes.length);

	// if(f % 10 === 0)
	// {
	// 	for(let j = 0; j < 128; j += 8)
	// 	{
	// 		pixSet(activeMask, out, 4 * (j + 64), types._SNOW);
	// 		// moved[j] = true;
	// 	}
	// }

	for(let j = activeMask.length; j -=4;)
	{
		activeMask[j-1] = activeMask[j-1] <= 16 ? 0 : activeMask[j-1] - 16;
	}

	const reversed = chance(0.5);

	const start = reversed ? bytes.length : 0;
	const end   = reversed ? 0 : bytes.length;
	const inc   = reversed ? -4 : 4;

	for(let i = start; (inc > 0) ? i < end : i > end; i += inc)
	{
		const a = bytes[i + 3];

		_totals.particles = 1 + (_totals.particles ?? 0);

		const r = bytes[i + 0];
		const g = bytes[i + 1];
		const b = bytes[i + 2];

		const x = (i / 4) % w;
		const y = Math.trunc(i / 4 / w);

		const xc =  Math.trunc(x / cellSize);
		const yc =  Math.trunc(y / cellSize);

		const ic  =  4 * xc  + 4 * yc  * Math.trunc(w / cellSize);

		if(f > 1 && !activeMaskPrev[ic + 3])
		{
			i += cellSize * inc;
			continue;
		}

		if(!a) continue;

		const levelL   = check(bytes, w, x - 1, y);
		const levelR   = check(bytes, w, x + 1, y);
		const levelLN  = check(out,   w, x - 1, y);
		const levelRN  = check(out,   w, x + 1, y);
		const levelLL  = check(bytes, w, x - 2, y);
		const levelRR  = check(bytes, w, x + 2, y);
		const levelLLN = check(out,   w, x - 2, y);
		const levelRRN = check(out,   w, x + 2, y);

		const above  = check(bytes, w, x + 0, y - 1);
		const below  = check(bytes, w, x + 0, y + 1);
		const belowL = check(bytes, w, x - 1, y + 1);
		const belowR = check(bytes, w, x + 1, y + 1);
		const aboveL = check(bytes, w, x - 1, y - 1);
		const aboveR = check(bytes, w, x + 1, y - 1);
		
		const aboveN  = check(out, w, x + 0, y - 1);
		const belowN  = check(out, w, x + 0, y + 1);
		const belowLN = check(out, w, x - 1, y + 1);
		const belowRN = check(out, w, x + 1, y + 1);
		const aboveLN = check(out, w, x - 1, y - 1);
		const aboveRN = check(out, w, x + 1, y - 1);

		// Fire
		if(pixMatch(bytes, types._FIRE, i))
		{
			if(!below[3] && !belowN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}

			else if((pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)))
			{
				pixSet(activeMask, out, i, types._SMOKE);
				moved[i] = true;
			}

			else if(chance(0.95) && (pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL)))
			{
				pixSet(activeMask, bytes, i + 4 * -w, types._FIRE);
				pixSet(activeMask, out, i + 4 * -w, types._FIRE);
				moved[i + 4 * -w] = true;
			}
			else if(chance(0.25) && (pixMatch(below, types._OIL) && pixMatch(belowN, types._OIL)))
			{
				pixSet(activeMask, bytes, i + 4 * w, types._FIRE);
				pixSet(activeMask, out, i + 4 * w, types._FIRE);
				moved[i + 4 * w] = true;
			}
			else if(chance(0.5) && (pixMatch(levelL, types._OIL) && pixMatch(levelLN, types._OIL)))
			{
				pixSet(activeMask, bytes, i - 4, types._FIRE);
				pixSet(activeMask, out, i - 4, types._FIRE);
				moved[i - 4] = true;
			}
			else if(chance(0.5) && (pixMatch(levelR, types._OIL) && pixMatch(levelRN, types._OIL)))
			{
				pixSet(activeMask, bytes, i + 4, types._FIRE);
				pixSet(activeMask, out, i + 4, types._FIRE);
				moved[i + 4] = true;
			}
			
			else if(chance(0.02) && (pixMatch(below, types._FIRE) && pixMatch(belowN, types._FIRE)))
			{
				pixSet(activeMask, out, i, types._SMOKE);
				moved[i] = true;
			}
			else if(chance(0.01) && !(pixMatch(above, types._FIRE) && pixMatch(aboveN, types._FIRE)))
			{
				pixSet(activeMask, out, i, types._SMOKE);
				moved[i] = true;
			}
		}
		
		// Smoke
		if(pixMatch(bytes, types._SMOKE, i))
		{
			if(pixMatch(above, types._LAVA) && pixMatch(aboveN, types._LAVA))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._SAND) && pixMatch(aboveN, types._SAND))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._SLIME) && pixMatch(aboveN, types._SLIME))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(chance(0.05)
				&& !below[3]
				&& !belowN[3]
				&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
				&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
			){
				pixSet(activeMask, out, i, types._SLIME);
				moved[i] = true;
			}
			// else if(chance(0.75)
			// 	&& pixMatch(levelL, types._STEAM)
			// 	&& pixMatch(levelR, types._STEAM)
			// 	&& pixMatch(levelLN, types._STEAM)
			// 	&& pixMatch(levelRN, types._STEAM)
			// 	&& pixMatch(levelLL, types._STEAM)
			// 	&& pixMatch(levelRR, types._STEAM)
			// 	&& pixMatch(levelLLN, types._STEAM)
			// 	&& pixMatch(levelRRN, types._STEAM)
			// ){
			// 	move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1)*(chance(0.75)?2:1), y);
			// }
			// else if(chance(0.3) && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM) && pixMatch(levelLL, types._STEAM) && pixMatch(levelLLN, types._STEAM))
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.75)?2:1), y);
			// }
			// else if(chance(0.3) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM) && pixMatch(levelRR, types._STEAM) && pixMatch(levelRRN, types._STEAM))
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.75)?2:1), y);
			// }
			else if(pixMatch(levelL, types._STEAM)
				&& pixMatch(levelR, types._STEAM)
				&& pixMatch(levelLN, types._STEAM)
				&& pixMatch(levelRN, types._STEAM)
			){
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1), y);
			}
			else if(chance(0.3) && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if(chance(0.3) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
			else if(!aboveL[3] && !aboveLN[3] && !aboveR[3] && !aboveRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5) ? -1:1), y - 1);
			}
			else if(chance(0.5) && !aboveL[3] && !aboveLN[3] && chance(0.5))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y - 1);
			}
			else if(chance(0.5) && !aboveR[3] && !aboveRN[3] && chance(0.5))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y - 1);
			}
			else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			}
			else if(chance(0.5) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
			}
			else if(chance(0.5) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
			}
			
			
		}

		// Snow
		if(pixMatch(bytes, types._SNOW, i))
		{
			// if(pixMatch(above, types._LAVA) && pixMatch(aboveN, types._LAVA))
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			// }
			// else if(pixMatch(above, types._SAND) && pixMatch(aboveN, types._SAND))
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			// }
			// else if(pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL))
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			// }
			if(chance(0.1) && pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER))
			{
				pixSet(activeMask, out, i, types._WATER);
				moved[i] = true;
			}
			else if(chance(0.1) && pixMatch(levelL, types._WATER) && pixMatch(levelLN, types._WATER))
			{
				pixSet(activeMask, out, i, types._WATER);
				moved[i] = true;
			}
			else if(chance(0.1) && pixMatch(levelL, types._WATER) && pixMatch(levelRN, types._WATER))
			{
				pixSet(activeMask, out, i, types._WATER);
				moved[i] = true;
			}
			else if(chance(0.1) && pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER))
			{
				pixSet(activeMask, out, i, types._WATER);
				moved[i] = true;
			}
			// else if(pixMatch(above, types._SLIME) && pixMatch(aboveN, types._SLIME))
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			// }
			else if(chance(0.7) && !below[3] && !belowN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			else if(chance(0.7) && !belowL[3] && !belowLN[3] && !belowR[3] && !belowRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5) ? -1:1), y - 1);
			}
			else if(chance(0.7) && !belowL[3] && !belowLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y - 1);
			}
			else if(chance(0.7) && !belowR[3] && !belowRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y - 1);
			}
			// else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			// }
			// else if(chance(0.5) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
			// }
			// else if(chance(0.5) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			// {
			// 	move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
			// }
			// else if(chance(0.01) 
			// 	&& !below[3]
			// 	&& !belowN[3]
			// 	&& pixMatch(above, types._STEAM) && pixMatch(aboveN, types._STEAM)
			// 	&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
			// 	&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
			// ){
			// 	pixSet(activeMask, out, i, types._WATER);
			// 	moved[i] = true;
			// }
			// else if(chance(0.005) 
			// 	&& !below[3]
			// 	&& !belowN[3]
			// 	&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
			// 	&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
			// ){
			// 	pixSet(activeMask, out, i, types._WATER);
			// 	moved[i] = true;
			// }
		}

		// Steam
		if(pixMatch(bytes, types._STEAM, i))
		{
			if(pixMatch(above, types._LAVA) && pixMatch(aboveN, types._LAVA))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._SAND) && pixMatch(aboveN, types._SAND))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(pixMatch(above, types._SLIME) && pixMatch(aboveN, types._SLIME))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(chance(0.7) && !above[3] && !aboveN[3] && chance(0.5))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(chance(0.7) && !aboveL[3] && !aboveLN[3] && !aboveR[3] && !aboveRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5) ? -1:1), y - 1);
			}
			else if(chance(0.7) && !aboveL[3] && !aboveLN[3] && chance(0.5))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y - 1);
			}
			else if(chance(0.7) && !aboveR[3] && !aboveRN[3] && chance(0.5))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y - 1);
			}
			else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			}
			else if(chance(0.5) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
			}
			else if(chance(0.5) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
			}
			else if(chance(0.01) 
				&& !below[3]
				&& !belowN[3]
				&& pixMatch(above, types._STEAM) && pixMatch(aboveN, types._STEAM)
				&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
				&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
			){
				pixSet(activeMask, out, i, types._WATER);
				moved[i] = true;
			}
			else if(chance(0.005) 
				&& !below[3]
				&& !belowN[3]
				&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
				&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
			){
				pixSet(activeMask, out, i, types._WATER);
				moved[i] = true;
			}
		}

		// Oil
		if(pixMatch(bytes, types._OIL, i))
		{
			if(!below[3] && !belowN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}

			else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			}
			else if(!levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
			}
			else if(!levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
			}
			
			else if(!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + Math.sign(-0.5 + Math.random()), y + 1);
			}
			
			else if(!belowL[3] && !belowLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y + 1);
			}
			else if(!belowR[3] && !belowRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y + 1);
			}
			
			else if(!levelL[3] && !levelLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if(!levelR[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
		}
		
		// SLIME
		if(pixMatch(bytes, types._SLIME, i))
		{
			if(!below[3] && !belowN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			else if(chance(0.9) && pixMatch(below, types._SAND) && pixMatch(belowN, types._SAND))
			{
			}
			else if(!belowL[3] && !belowLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y + 1);
			}
			else if(!belowR[3] && !belowRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y + 1);
			}
			else if(!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + Math.sign(-0.5 + Math.random()), y);
			}
			else if((pixMatch(levelL, types._OIL) || pixMatch(levelL,  types._WATER)|| pixMatch(levelL,  types._HEAVY))
				&& (pixMatch(levelR, types._OIL)  || pixMatch(levelR,  types._WATER)|| pixMatch(levelR,  types._HEAVY))
				&& (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER)|| pixMatch(levelLN, types._HEAVY))
				&& (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER)|| pixMatch(levelRN, types._HEAVY))
			){
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1), y);
			}
			else if((pixMatch(levelL, types._OIL) || pixMatch(levelL, types._WATER) || pixMatch(levelL, types._HEAVY))
				&& (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER) || pixMatch(levelLN, types._HEAVY))
				&& (pixMatch(levelLLN, types._OIL) || pixMatch(levelLLN, types._WATER) || pixMatch(levelLLN, types._HEAVY))
			){
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if((pixMatch(levelR, types._OIL) || pixMatch(levelR, types._WATER) || pixMatch(levelR, types._HEAVY))
				&& (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER) || pixMatch(levelRN, types._HEAVY))
				&& (pixMatch(levelRRN, types._OIL) || pixMatch(levelRRN, types._WATER) || pixMatch(levelRRN, types._HEAVY))
			){
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
			else if(chance(0.35) && (pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER) || pixMatch(above, types._HEAVY) && pixMatch(aboveN, types._HEAVY)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
			}
			else if(chance(0.75) && (pixMatch(belowL, types._OIL) && pixMatch(belowLN, types._OIL)) || (pixMatch(belowL, types._WATER) && pixMatch(belowLN, types._WATER)) || (pixMatch(belowL, types._HEAVY) && pixMatch(belowLN, types._HEAVY)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y + 1);
			}
			else if(chance(0.75) && (pixMatch(belowR, types._OIL) && pixMatch(belowRN, types._OIL)) || (pixMatch(belowR, types._WATER) && pixMatch(belowRN, types._WATER)) || (pixMatch(belowR, types._HEAVY) && pixMatch(belowRN, types._HEAVY)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y + 1);
			}
			else if(chance(0.2) && !levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			}
			else if(chance(0.01) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
			}
			else if(chance(0.01) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
			}
			else if(chance(0.02) && !levelL[3] && !levelLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if(chance(0.02) && !levelR[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
		}

		// Salt Water		
		if(pixMatch(bytes, types._HEAVY, i))
		{
			if(!belowN[3] || pixMatch(belowN, types._OIL) || (chance(0.05) && pixMatch(belowN, types._WATER)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			}
			else if((pixMatch(levelL, types._OIL) || pixMatch(levelL,  types._WATER))
				&& (pixMatch(levelR, types._OIL)  || pixMatch(levelR,  types._WATER))
				&& (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER))
				&& (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER))
			){
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1), y);
			}
			else if((pixMatch(levelL, types._OIL) || pixMatch(levelL, types._WATER))
				&& (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER))
				&& (pixMatch(levelLLN, types._OIL) || pixMatch(levelLLN, types._WATER))
			){
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if((pixMatch(levelR, types._OIL) || pixMatch(levelR, types._WATER))
				&& (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER))
				&& (pixMatch(levelRRN, types._OIL) || pixMatch(levelRRN, types._WATER))
			){
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
			else if(!belowLN[3] || pixMatch(belowLN, types._OIL) || pixMatch(belowLN, types._WATER))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y + 1);
			}
			else if(!belowRN[3] || pixMatch(belowRN, types._OIL) || pixMatch(belowRN, types._WATER))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y + 1);
			}
			else if(!levelL[3] && !levelLN[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.1) ? 1:2), y);
			}
			else if(!levelR[3] && !levelRN[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.1) ? 1:2), y);
			}
			else if(!levelL[3] && !levelLN[3] && chance(0.25))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if(!levelR[3] && !levelRN[3] && chance(0.25))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
			else if((!above[3] && chance(0.4 * 2)) || chance(0.25 * 2))
			{
				if(pixMatch(levelL, types._SAND) && pixMatch(levelLN, types._SAND) && pixMatch(belowL, types._SAND))
				{
					move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
				}
				else if(pixMatch(levelR, types._SAND) && pixMatch(levelRN, types._SAND) && pixMatch(belowR, types._SAND))
				{
					move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
				}
			}
		}

		// Water		
		if(pixMatch(bytes, types._WATER, i))
		{
			const coinFlip = chance(0.5);

			if(!below[3] && !belowN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}

			else if(!above[3] && !aboveN[3] && pixMatch(below, types._SAND) && pixMatch(belowN, types._SAND) && !belowL[3] && !belowLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y + 1, x - 1, y + 1);
			}
			else if(!above[3] && !aboveN[3] && pixMatch(below, types._SAND) && pixMatch(belowN, types._SAND) && !belowR[3] && !belowRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y + 1, x + 1, y + 1);
			}
			
			else if(pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3] && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.1) ? 1:2) * (chance(0.5) ? -1:1), y);
			}
			else if(coinFlip && pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.1) ? 1:2), y);
			}
			else if(!coinFlip && pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.1) ? 1:2), y);
			}


			else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1), y);
			}
			else if(coinFlip && !pixMatch(above, types._SAND) && !pixMatch(aboveN, types._SAND) && !levelL[3] && !levelLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if(!coinFlip && !pixMatch(above, types._SAND) && !pixMatch(aboveN, types._SAND) && !levelR[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}

			else if(pixMatch(below, types._OIL) && pixMatch(belowN, types._OIL))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			else if(pixMatch(levelL, types._OIL)
				&& pixMatch(levelR, types._OIL)
				&& pixMatch(levelLN, types._OIL)
				&& pixMatch(levelRN, types._OIL)
			){
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1), y);
			}
			else if(pixMatch(levelL, types._OIL)
				&& pixMatch(levelLN, types._OIL)
				&& pixMatch(levelLL, types._OIL)
				&& pixMatch(levelLLN, types._OIL)
			){
				move(bytes, out, moved, activeMask,  w, x - 1, y, x, y);
			}
			else if(pixMatch(levelR, types._OIL)
				&& pixMatch(levelRN, types._OIL)
				&& pixMatch(levelRR, types._OIL)
				&& pixMatch(levelRRN, types._OIL)
			){
				move(bytes, out, moved, activeMask,  w, x + 1, y, x, y);
			}

			else if(coinFlip && !above[3] && !aboveN[3] && (!belowL[3] || pixMatch(belowL, types._OIL)) && (!belowLN[3] || pixMatch(belowLN, types._OIL)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y + 1);
			}
			else if(!coinFlip && !above[3] && !aboveN[3] && (!belowR[3] || pixMatch(belowR, types._OIL)) && (!belowRN[3] || pixMatch(belowRN, types._OIL)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y + 1);
			}

			else if(!pixMatch(above, types._SAND) && !pixMatch(aboveN, types._SAND) && ((!above[3] && chance(0.01)) || chance(0.1)))
			{
				if(pixMatch(levelL, types._SAND)
					&& pixMatch(levelR, types._SAND)
					&& pixMatch(levelLN, types._SAND)
					&& pixMatch(levelRN, types._SAND)
				){
					move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1), y);
				}
				else if(coinFlip && pixMatch(levelL, types._SAND) && pixMatch(levelLN, types._SAND))
				{
					move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
				}
				else if(!coinFlip && pixMatch(levelR, types._SAND) && pixMatch(levelRN, types._SAND))
				{
					move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
				}
			}
			
		}

		// Sand
		if(pixMatch(bytes, types._SAND, i))
		{
			if((!below[3] && !belowN[3]) || (
				(pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER))
				|| (pixMatch(below, types._HEAVY) && pixMatch(belowN, types._HEAVY))
				|| (pixMatch(below, types._OIL) && pixMatch(belowN, types._OIL))
			)){
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			
			else if(chance(0.2))
			{
				if(!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3])
				{
					move(bytes, out, moved, activeMask,  w, x, y, x + Math.sign(-0.5 + Math.random()), y);
				}
				else if((!above[3] && chance(0.3)) || chance(0.02))
				{
					if(!belowL[3] && !belowLN[3] && !levelL[3] && !levelLN[3])
					{
						move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
					}
					else if(!belowR[3] && !belowRN[3] && !levelR[3] && !levelRN[3])
					{
						move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
					}
				}
			}
		}

		// Lava
		if(pixMatch(bytes, types._LAVA, i))
		{
			if(chance(0.75) && (pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)))
			{
				pixSet(activeMask, bytes, i + 4 * -w, types._STEAM);
				pixSet(activeMask, out, i + 4 * -w, types._STEAM);
				moved[i + 4 * -w] = true;
			}
			else if(chance(0.75) && (pixMatch(levelL, types._WATER) && pixMatch(levelLN, types._WATER)))
			{
				pixSet(activeMask, bytes, i - 4, types._STEAM);
				pixSet(activeMask, out, i - 4, types._STEAM);
				moved[i - 4] = true;
			}
			else if(chance(0.75) && (pixMatch(levelR, types._WATER) && pixMatch(levelRN, types._WATER)))
			{
				pixSet(activeMask, bytes, i + 4, types._STEAM);
				pixSet(activeMask, out, i + 4, types._STEAM);
				moved[i + 4] = true;
			}
			else if((pixMatch(below, types._SLIME) && pixMatch(belowN, types._SLIME)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			else if((pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL)))
			{
				pixSet(activeMask, bytes, i + 4 * -w, types._FIRE);
				pixSet(activeMask, out, i + 4 * -w, types._FIRE);
				moved[i + 4 * -w] = true;
			}
			else if((pixMatch(levelL, types._OIL) && pixMatch(levelLN, types._OIL)))
			{
				pixSet(activeMask, bytes, i - 4, types._FIRE);
				pixSet(activeMask, out, i - 4, types._FIRE);
				moved[i - 4] = true;
			}
			else if((pixMatch(levelR, types._OIL) && pixMatch(levelRN, types._OIL)))
			{
				pixSet(activeMask, bytes, i + 4, types._FIRE);
				pixSet(activeMask, out, i + 4, types._FIRE);
				moved[i + 4] = true;
			}
			else if((!below[3] && !belowN[3]) || (
				(pixMatch(below, types._WATER) || pixMatch(below, types._HEAVY) || pixMatch(below, types._OIL))
				 && (pixMatch(belowN, types._WATER) || pixMatch(belowN, types._HEAVY) || pixMatch(belowN, types._OIL))
			)){
				move(bytes, out, moved, activeMask,  w, x, y, x, y + 1);
			}
			else if(chance(0.9))
			{
				if(!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3])
				{
					move(bytes, out, moved, activeMask,  w, x, y, x + Math.sign(-0.5 + Math.random()), y);
				}
				else if((!above[3] && chance(0.5)) || chance(0.05))
				{
					if( ((!levelL[3] && !levelLN[3]) || (pixMatch(levelL, types._SLIME) && pixMatch(levelLN, types._SLIME)) ) && ((!belowL[3] && !belowLN[3]) || (pixMatch(belowL, types._SLIME) && pixMatch(belowLN, types._SLIME))))
					{
						move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
					}
					else if(((!levelR[3] && !levelRN[3]) || (pixMatch(levelR, types._SLIME) && pixMatch(levelRN, types._SLIME)) ) && ((!belowR[3] && !belowRN[3]) || (pixMatch(belowR, types._SLIME) && pixMatch(belowRN, types._SLIME))))
					{
						move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
					}
				}
			}
			else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
			}
			else if(chance(0.04) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
			}
			else if(chance(0.04) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
			}
			else if(chance(0.04) && (!levelL[3] && !levelLN[3]) || (pixMatch(levelL, types._SLIME) && pixMatch(levelLN, types._SLIME)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x - 1, y);
			}
			else if(chance(0.04) && (!levelR[3] && !levelRN[3]) || (pixMatch(levelR, types._SLIME) && pixMatch(levelRN, types._SLIME)))
			{
				move(bytes, out, moved, activeMask,  w, x, y, x + 1, y);
			}
		}
	}

	bytes.set(out);

	for(const i in _totals)
	{
		_totals[i] = 0;
	}
	
	for(const i in totals)
	{
		_totals[i] = 0;
	}

	for(let i = 0; i < out.length; i += 4)
	{
		if(!out[i + 3]) continue;

		_totals.particles++;

		if(pixMatch(bytes, types._STEAM, i))
		{
			_totals.steam = 1 + (_totals.steam ?? 0)
			_totals.water = 1 + (_totals.water ?? 0)
		}
		if(pixMatch(bytes, types._WATER, i))
		{
			_totals.freshWater = 1 + (_totals.freshWater ?? 0)
			_totals.water = 1 + (_totals.water ?? 0)
		}
		if(pixMatch(bytes, types._SAND, i))
		{
			_totals.sand = 1 + (_totals.sand ?? 0)
		}
		if(pixMatch(bytes, types._LAVA, i))
		{
			_totals.lava = 1 + (_totals.lava ?? 0)
		}
		if(pixMatch(bytes, types._OIL, i))
		{
			_totals.oil = 1 + (_totals.oil ?? 0)
		}
		if(pixMatch(bytes, types._SLIME, i))
		{
			_totals.slime = 1 + (_totals.slime ?? 0)
		}
		if(pixMatch(bytes, types._FIRE, i))
		{
			_totals.fire = 1 + (_totals.fire ?? 0)
		}
		if(pixMatch(bytes, types._SMOKE, i))
		{
			_totals.smoke = 1 + (_totals.smoke ?? 0)
		}
	}
	
	Object.assign(totals, _totals);
}

let buttonDown = false;

const addParticle = event => {
	const rect = event.target.getBoundingClientRect();
	const xs = event.clientX - rect.left;
	const ys = event.clientY - rect.top;
	const ws = rect.width;
	const hs = rect.height;

	const x = Math.floor(width  * xs / ws);	
	const y = Math.floor(height * ys / hs);

	pixSet(activeDataA.data, imageData.data,  4 * parseInt(x + y * width), selectedType);
};

canvas.addEventListener('mouseup', event => buttonDown = false);

canvas.addEventListener('mousedown', event => {
	addParticle(event);
	buttonDown = true;
});

canvas.addEventListener('mousemove', event => buttonDown && addParticle(event));

document.addEventListener('DOMContentLoaded', event => {
	document.body.appendChild(canvas);
	document.body.appendChild(active);
	palletView.render(document.body);
	// totalView.render(document.body);

	let frame = 0;
	const last = 0;

	const renderLoop = time => {
		if(time - frame < 16/1000)
		{
			requestAnimationFrame(renderLoop);
		}

		console.time('frame');
		update(imageData.data, width, frame++);
		context.putImageData(imageData, 0, 0);
		activeContext.putImageData(frame % 2 ? activeDataB : activeDataA, 0, 0);
		requestAnimationFrame(renderLoop);
		// setTimeout(renderLoop, 50);
		// setTimeout(renderLoop, 0);
		console.timeEnd('frame');
		// for(let i = 0; i < activeData.data.length; i += 4)
		// {
		// 	activeData.data[i+0] = 0;
		// 	activeData.data[i+1] = 0;
		// 	activeData.data[i+2] = 0;
		// 	activeData.data[i+3] = 0;
		// }
	};

	renderLoop();
});
