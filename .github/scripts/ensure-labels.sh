#!/usr/bin/env bash
# Crea (o actualiza) los labels del proyecto usados por el triage automático de issues.
# Idempotente: `gh label create --force` sobreescribe color/descripción si el label ya existe.
set -euo pipefail

create_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" --color "$color" --description "$description" --force
}

create_label "area:gameplay"     "1d76db" "Colisión, rotación, wall kicks, spawn, drop"
create_label "area:ui"           "5319e7" "Canvas, render, overlay, HUD, estilos"
create_label "area:scoring"      "0e8a16" "Score, lines, level, dropInterval"
create_label "area:input"        "fbca04" "Teclado, controles, pausa"

create_label "priority:high"     "b60205" "Bloquea el juego o rompe una mecánica core"
create_label "priority:medium"   "d93f0b" "Afecta la experiencia pero tiene workaround"
create_label "priority:low"      "c2e0c6" "Cosmético o mejora menor"

create_label "complexity:small"  "c5def5" "Cambio de pocas líneas en un único punto"
create_label "complexity:medium" "c5def5" "Toca varias funciones o estado compartido"
create_label "complexity:large"  "c5def5" "Requiere rediseñar un mecanismo del juego"
