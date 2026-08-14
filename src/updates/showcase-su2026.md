---
title: "CDP Summer Showcase 2026"
shortDescription: "An ambient exhibition display for seventeen student projects, running on a Raspberry Pi."
date: 2026-08-01
team: ["Adam Vosburgh"]
tags: ["updates"]
images:
  - "/images/showcase-su2026/showcase-1.jpg"
display:
  coverImage: "/images/showcase-su2026/showcase.mp4"
  slideshowImages:
  showInSlideshow: false
layout: "item.njk"
size: 1
link: https://github.com/adamvosburgh/cdp-su2026-showcase
linkExternal: true
---

A continuously running display for the end-of-summer exhibition of the MS CDP program, showing seventeen student projects on a 108" screen over an eighteen-minute rotation.

The problem with a screen in an exhibition is that it is either a video loop nobody watches to the end, or a menu nobody touches. This tries for something else: a field that content precipitates out of and dissolves back into. Transitions run as a mosaic across a 240×135 grid — at that size each block is about a centimetre on the wall, large enough to read as a block rather than as texture from across the room. Video, text, and glow all dissolve through the same grid, so nothing arrives as a panel sliding into a slot, and staggering in both time and position keeps the eye from learning where the next thing will appear.

Projects are positioned by meaning rather than by list order. Project texts are embedded and reduced to three dimensions, so what sits near what is a function of what the work is about. Each project carries a glow colour sampled from its own footage — hue only, taken as a saturation-weighted circular mean across frames, with lightness and saturation held constant so every project has identical visual weight against white and only the colour changes. Sampling the dominant pixel instead would have returned near-black for almost everything, since most of the material is screen recordings of dark or white interfaces.

Two of the seventeen projects had no video, only live websites. Those were captured with a scripted browser that scrolls at an even rate and, for one project built around interactive maps and toggles, drives the interface with a synthetic cursor so the recording reads as someone using the site rather than a page operating itself.

Runs as a kiosk on a Raspberry Pi, with media rendered ahead of time and served locally.
