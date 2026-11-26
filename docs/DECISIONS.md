# Qarorlar (2026-11-25)

1. Mezon: 100% kod, rasmsiz.
2. Render: to'rt usul ham sinaladi, g'olib ko'rib tanlanadi.
3. Solishtirish: to'liq sahna, bitta kadr (150-kadr).
4. Nuqsonlar: tozalab tiklanadi ("Desert" / "GAS & OIL", abstrakt furgon naqshi).
5. Yakuniy natija: 1080x1920 60 fps MP4 va interaktiv HTML.
6. Blender: 4.5 LTS portable, E: diskda.
7. Qabul: kontur ±1%, zona rangi o'rtacha ΔE < 6, parallaks ±5%, so'nggi so'z ko'z bilan.
8. Ovoz: kodda yozilgan original musiqa.
9. Repo: public; manba video repoga kirmaydi.
10. Ish tartibi: to'xtovsiz.

Blender usuli JS generatori yaratgan geometriyani o'qiydi, material, nur, kamera va render Python'da.

11. G'olib: Blender Cycles.
12. Yakuniy render: 64 namuna, 4 sakrash, GPU denoise (256 namunaga nisbatan PSNR 42,4 dB).

# Zoom va 4K qarorlari (2026-11-25)

Boshlanish: foydalanuvchi aytganda.

1. Hozir artifact o'zgarmaydi; zoom va yuqori sifat tunda birga chiqadi.
2. Sifat: 2160x3840 60 fps lokal master, sahifada 1080p video, pauzada 4K WebP kadrlar.
3. Render oldidan: neon tom, furgon, tekislik, pushti devor rangi; tog' relyefi; furgon, kolonka, vitrina va vyveska detali.
4. Boshqaruv: g'ildirak, ikki marta bosish, pinch, + / - / Reset. 1x da sudrash kamerani, zoomda kadrni suradi.
5. Eng katta zoom: 6x, video o'ynayveradi.
6. Nashr: mezon o'tsa artifact shu havolada yangilanadi va repo push qilinadi; o'tmasa eski versiya qoladi.

Chegaralar: artifact'da bitta binar fayl 15 MB, bir yuborishda 64 MB.

7. Bajarildi 2026-11-26: 4K render 64 namuna (11,3 s/kadr), WebP q90 har 15-kadr, ΔE 5,1. Eski artifact serverda topilmadi, yangi havola: https://claude.ai/artifact/WiNyjYSTkq3ggvgZ9aRdes
