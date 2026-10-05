import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
src, dst, thr, satmax, holes = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]=='1'
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int)
mn = a.min(2); sat = a.max(2) - mn
bgish = (mn >= thr) & (sat <= satmax)
lab, n = nd.label(bgish)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
bg = np.isin(lab, list(border))
if holes:
    pure = (mn >= 247) & (sat <= 6)
    l2, n2 = nd.label(pure)
    sizes = nd.sum(pure, l2, range(1, n2+1))
    cy = nd.center_of_mass(pure, l2, range(1, n2+1))
    bg |= np.isin(l2, [i+1 for i,s in enumerate(sizes) if s > 1500 and cy[i][0] < 0.35*a.shape[0]])
fg = nd.binary_opening(~bg, iterations=2)
l3, n3 = nd.label(fg)
sizes = nd.sum(fg, l3, range(1, n3+1)); fg = np.isin(l3, [i+1 for i,s in enumerate(sizes) if s > 0.02*sizes.max()])
alpha = Image.fromarray((fg*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.0))
out = im.convert('RGBA'); out.putalpha(alpha); out = out.crop(out.getbbox()); out.save(dst)
pv = Image.new('RGBA', out.size, (217,101,138,255)); pv.alpha_composite(out); pv.convert('RGB').save(dst.replace('.png','_pv.jpg'))
