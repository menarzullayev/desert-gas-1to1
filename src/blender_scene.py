"""Method 4: Blender Cycles. blender -b -P src/blender_scene.py -- <meshdir> <out.png> [frame] [samples] [percent]"""
import bpy, sys, json, math, os
import numpy as np
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
D, OUT = os.path.abspath(a[0]), os.path.abspath(a[1])
FRAME, SPP, PCT = (int(v) for v in (a[2:5] + ['150', '256', '150'][len(a) - 2:]))
W, H, F, CX, CY, CAMH, PIVOT, TRAVEL = 720, 1280, 1720, 360, 730, 1.7, 43, 1.62
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def rd(n, t=np.float32):
    return np.fromfile(os.path.join(D, n), t)


def zup(v):  # three.js y-up to Blender z-up
    return np.stack([v[:, 0], -v[:, 2], v[:, 1]], 1).astype(np.float32)


def img(n):
    i = bpy.data.images.load(os.path.join(D, n))
    i.colorspace_settings.name = 'sRGB'
    return i


def material(e):
    m = bpy.data.materials.new(e['name'])
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    out = N('ShaderNodeOutputMaterial')

    def tex(n):
        t = N('ShaderNodeTexImage')
        t.image, t.extension = img(n), 'EXTEND'
        return t.outputs[0]

    def vcol():
        c = N('ShaderNodeVertexColor')
        c.layer_name = 'Col'
        return c.outputs[0]

    if e['basic']:
        em = N('ShaderNodeEmission')
        L(em.outputs[0], out.inputs[0])
        L(vcol() if e['col'] else tex(e['map']), em.inputs[0])
        return m
    b = N('ShaderNodeBsdfPrincipled')
    L(b.outputs[0], out.inputs[0])
    b.inputs['Roughness'].default_value = e['rough']
    b.inputs['Metallic'].default_value = e['metal']
    b.inputs['Base Color'].default_value = (*e['color'], 1)
    src = vcol() if e['col'] else tex(e['map']) if e.get('map') else None
    if src:
        L(src, b.inputs['Base Color'])
    if max(e['em']) * e['ei'] > 0:
        b.inputs['Emission Strength'].default_value = e['ei']
        b.inputs['Emission Color'].default_value = (*e['em'], 1)
        if e.get('emap'):
            L(tex(e['emap']), b.inputs['Emission Color'])

    def bump(scale, detail, dist, prev=None):
        g, n, bp = N('ShaderNodeNewGeometry'), N('ShaderNodeTexNoise'), N('ShaderNodeBump')
        n.inputs['Scale'].default_value, n.inputs['Detail'].default_value, n.inputs['Roughness'].default_value = scale, detail, 0.65
        bp.inputs['Distance'].default_value, bp.inputs['Strength'].default_value = dist, 0.9
        L(g.outputs['Position'], n.inputs['Vector'])
        L(n.outputs[0], bp.inputs['Height'])
        if prev:
            L(prev.outputs[0], bp.inputs['Normal'])
        return bp

    k = e['name']
    if k == 'ground':
        L(bump(70, 6, 0.012, bump(14, 8, 0.03)).outputs[0], b.inputs['Normal'])
        # granular albedo variation: grit between the modelled stones
        g, v, r, mx = N('ShaderNodeNewGeometry'), N('ShaderNodeTexVoronoi'), N('ShaderNodeValToRGB'), N('ShaderNodeMix')
        v.inputs['Scale'].default_value = 34
        L(g.outputs['Position'], v.inputs['Vector'])
        r.color_ramp.elements[0].color = (1.0, 0.97, 1.0, 1)
        r.color_ramp.elements[1].position, r.color_ramp.elements[1].color = 0.7, (0.5, 0.48, 0.52, 1)
        L(v.outputs['Distance'], r.inputs[0])
        mx.data_type, mx.blend_type = 'RGBA', 'MULTIPLY'
        mx.inputs[0].default_value = 0.8
        L(src, mx.inputs[6])
        L(r.outputs[0], mx.inputs[7])
        L(mx.outputs[2], b.inputs['Base Color'])
    elif k == 'stones':
        L(bump(60, 8, 0.006).outputs[0], b.inputs['Normal'])
    elif k in ('vanSide', 'vanFront', 'vanRoof'):
        b.inputs['Coat Weight'].default_value, b.inputs['Coat Roughness'].default_value = 0.22, 0.12
    elif k == 'vanGlass':
        b.inputs['Alpha'].default_value, b.inputs['Roughness'].default_value, b.inputs['Coat Weight'].default_value = .45, .04, 1.0
    elif k in ('plants', 'sage'):
        b.inputs['Specular IOR Level'].default_value = 0.2
    return m


for e in json.load(open(os.path.join(D, 'meta.json'))):
    v = zup(rd(e['name'] + '.pos').reshape(-1, 3))
    ix = rd(e['name'] + '.idx', np.uint32).astype(np.int32) if e['idx'] else np.arange(len(v), dtype=np.int32)
    me = bpy.data.meshes.new(e['name'])
    me.vertices.add(len(v))
    me.vertices.foreach_set('co', v.ravel())
    me.loops.add(len(ix))
    me.loops.foreach_set('vertex_index', ix)
    me.polygons.add(len(ix) // 3)
    me.polygons.foreach_set('loop_start', np.arange(0, len(ix), 3, dtype=np.int32))
    me.update(calc_edges=True)
    if e['col']:
        c = rd(e['name'] + '.col').reshape(-1, 3)
        at = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        at.data.foreach_set('color', np.concatenate([c, np.ones((len(c), 1), np.float32)], 1).ravel())
    if e['uv']:
        me.uv_layers.new().data.foreach_set('uv', rd(e['name'] + '.uv').reshape(-1, 2)[ix].ravel())
    me.polygons.foreach_set('use_smooth', np.ones(len(ix) // 3, bool))
    if e['n'] < 1500000:
        me.normals_split_custom_set_from_vertices(zup(rd(e['name'] + '.nor').reshape(-1, 3)).tolist())
    o = bpy.data.objects.new(e['name'], me)
    sc.collection.objects.link(o)
    me.materials.append(material(e))
    if e['basic']:
        o.visible_diffuse = o.visible_glossy = o.visible_shadow = False

# Environment: three.js equirect has +x at its centre, Blender has +x at 1/2 + 1/4; three -z (front) is Blender +y.
env = rd('env.f32').reshape(256, 512, 4)
im = bpy.data.images.new('env', 512, 256, float_buffer=True)
im.colorspace_settings.name = 'Non-Color'
# Blender: u = atan2(y, -x) / 2pi + 1/2; three: u = atan2(z, x) / 2pi + 1/2 with z = -y, hence u_three = -atan2(y, x)/2pi + 1/2
u = (np.arange(512) + 0.5) / 512
ang = (u - 0.5) * 2 * np.pi
x, y = -np.cos(ang), np.sin(ang)
ut = np.mod(np.arctan2(-y, x) / (2 * np.pi) + 0.5, 1)
env = env[:, np.clip((ut * 512).astype(int), 0, 511)]
im.pixels.foreach_set(env.astype(np.float32).ravel())
im.update()
w = bpy.data.worlds.new('W')
sc.world = w
w.use_nodes = True
t = w.node_tree.nodes.new('ShaderNodeTexEnvironment')
t.image = im
bg = w.node_tree.nodes['Background']
w.node_tree.links.new(t.outputs[0], bg.inputs[0])
bg.inputs[1].default_value = 0.6


def lin(h):
    return tuple(((int(h[i:i + 2], 16) / 255 + 0.055) / 1.055) ** 2.4 for i in (1, 3, 5))


def light(kind, col, power, loc, look, size=None, size_y=None):
    l = bpy.data.lights.new('L', kind)
    l.color, l.energy = lin(col), power
    if size:
        l.shape, l.size, l.size_y = 'RECTANGLE', size, size_y
    o = bpy.data.objects.new('L', l)
    o.location = (loc[0], -loc[2], loc[1])
    o.rotation_euler = (Vector((look[0], -look[2], look[1])) - o.location).to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(o)
    o.visible_camera = False
    return l


def rect(col, radiance, wd, ht, p, q):  # radiance L -> radiant power L * A * pi
    light('AREA', col, radiance * wd * ht * math.pi, p, q, wd, ht)


light('SUN', '#f584c0', 2.5, (-26, 9, -3), (0, 0, -14)).angle = math.radians(6)


def cp(t, u):
    return (2.65 - 3.36 * t + 3.49 * u, 41 + 4 * t + 3 * u)


for tt, uu in ((.72, .1), (.3, .12), (.1, .35), (.1, .72), (.6, .55), (.4, .8)):
    c = cp(tt, uu)
    rect('#ffb070', 70, 1.0, .35, (c[0], 2.72, -c[1]), (c[0], 0, -c[1] + .001))
c, d = cp(.5, -.05), cp(.5, -.4)
rect('#4fc8ff', 4, 5, .4, (c[0] - .3, 3.0, -(c[1] - .3)), (d[0] - 2, 0, -(d[1] - 2)))
rect('#ffbf70', 3.2, 2.4, 1.5, (7.75, 1.55, -49.4), (6.6, .6, -46))
rect('#8fc8ff', 3, 5, 1.2, (6.6, 2.2, -46.2), (7.9, 1.2, -49.7))
rect('#9fe0ff', 4.2, 4, 1.6, (-7.5, 2.6, -35.5), (-2.6, .9, -41.5))  # soft fill on the van
rect('#ff6a86', .9, 2, 2, (4.6, 1.6, -47.4), (6.4, 1.5, -50.8))

TR = [v / 253 for v in (0, 17, 42, 72, 100, 126, 151, 174, 197, 217, 236, 253)]


def camx(f):
    k = min(11, max(0, f / 30))
    i = min(10, int(k))
    t = k - i
    p0, p1, p2, p3 = (TR[min(11, max(0, i + n))] for n in (-1, 0, 1, 2))
    return -(.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3) - TR[5]) * TRAVEL


cam = bpy.data.cameras.new('C')
co = bpy.data.objects.new('C', cam)
sc.collection.objects.link(co)
sc.camera = co
x = camx(FRAME)
co.location, co.rotation_euler = (x, 0, CAMH), (math.pi / 2, 0, 0)
cam.sensor_fit, cam.sensor_height, cam.lens = 'VERTICAL', 36, 36 * F / H
cam.clip_start, cam.clip_end = .3, 9000
cam.shift_x, cam.shift_y = -(CX + F * x / PIVOT - W / 2) / H, (CY - H / 2) / H

r, cy = sc.render, sc.cycles
r.engine = 'CYCLES'
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, PCT
cy.samples, cy.use_adaptive_sampling, cy.adaptive_threshold = SPP, True, .012
cy.use_denoising, cy.denoiser, cy.max_bounces, cy.sample_clamp_indirect = True, 'OPENIMAGEDENOISE', 6, 8
cy.denoising_use_gpu = True
cy.max_bounces = int(os.environ.get('BOUNCES', '6'))
cy.adaptive_threshold = float(os.environ.get('NOISE', '0.012'))
cy.denoising_prefilter = os.environ.get('PREFILTER', 'ACCURATE')
cy.caustics_reflective = cy.caustics_refractive = False
prefs = bpy.context.preferences.addons['cycles'].preferences
for kind in ('OPTIX', 'CUDA'):
    try:
        prefs.compute_device_type = kind
        prefs.get_devices()
        for q in prefs.devices:
            q.use = q.type == kind
        cy.device = 'GPU'
        print('DEVICE', kind, [q.name for q in prefs.devices if q.use])
        break
    except Exception as ex:
        print('DEVICE failed', kind, ex)
sc.view_settings.view_transform, sc.view_settings.look = 'Standard', 'None'
r.image_settings.file_format = 'PNG'
sc.use_nodes = True
r.compositor_device = os.environ.get('COMP', 'GPU')
cy.use_auto_tile = False
nt = sc.node_tree
rl = next(q for q in nt.nodes if q.type == 'R_LAYERS') if any(q.type == 'R_LAYERS' for q in nt.nodes) else nt.nodes.new('CompositorNodeRLayers')
cn = next((q for q in nt.nodes if q.type == 'COMPOSITE'), None) or nt.nodes.new('CompositorNodeComposite')
gl = nt.nodes.new('CompositorNodeGlare')
try:
    gl.glare_type, gl.quality = 'BLOOM', 'HIGH'
    gl.inputs['Threshold'].default_value, gl.inputs['Strength'].default_value, gl.inputs['Size'].default_value = 1.0, .22, .35
except Exception as ex:
    print('glare fallback', ex)
nt.links.new(rl.outputs[0], gl.inputs[0])
nt.links.new(gl.outputs[0], cn.inputs[0])
if os.environ.get('ANIM'):  # 60 fps animation, resumable: OUT is a directory, ANIM is "first-last"
    f0, f1 = (int(v) for v in os.environ['ANIM'].split('-'))
    sc.frame_start, sc.frame_end, r.fps = f0, f1, 60
    for i in range(f0, f1 + 1):
        x = camx(i / 2)
        co.location.x, cam.shift_x = x, -(CX + F * x / PIVOT - W / 2) / H
        co.keyframe_insert('location', index=0, frame=i)
        cam.keyframe_insert('shift_x', frame=i)
    r.use_persistent_data, r.use_overwrite, r.filepath = True, False, os.path.join(OUT, 'f####')
    bpy.ops.render.render(animation=True)
else:
    r.filepath = OUT
    bpy.ops.render.render(write_still=True)
print('DONE', OUT)
