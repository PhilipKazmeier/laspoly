// ---------------------------------------------------------------------------
// ui/deed-card.ts — THE deed card (plan phase 4): one physical paper card
// used everywhere a property is shown — the buy prompt rising from its tile,
// the tile-click inspector, the hover tooltip (mini), and the my-properties
// cards. Data in, DOM out; consumes design tokens only.
//
// The i18n function and group-colour resolver are passed in (they live in
// ui.ts) to avoid a module cycle.
// ---------------------------------------------------------------------------
import { getBoard, tilePrice } from "@laspoly/shared";
import type { GameState, StreetTile } from "@laspoly/shared";

export interface DeedCardAction {
  id?: string;
  label: string;
  kind: "primary" | "quiet" | "danger";
  onClick: () => void;
}

export interface DeedCardOptions {
  state: GameState;
  pos: number;
  tr: (key: string) => string;
  groupColor: (group: string) => string;
  /** mini: band + name + the load-bearing numbers only (tooltip / fan). */
  mini?: boolean;
  actions?: DeedCardAction[];
  onClose?: () => void;
  /** Extra line under the rent table (e.g. the buyer's balance). */
  footnote?: { id?: string; text: string };
  /** Optional element id for the name span (spec contract, e.g. buyTileName). */
  nameId?: string;
  /** Optional element id for the price value (spec contract, e.g. buyPrice). */
  priceId?: string;
}

/** Mute a hex colour toward printed pigment (mirror of board3d muteColor). */
function mutePigment(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  const mix = (ch: number) => Math.round((ch * 0.78 + grey * 0.22) * 0.92);
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, "0")}`;
}

/** Perceived luminance 0..1 of a hex colour (band-ink contrast decision). */
function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1]!, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** Which rent row currently applies (highlighted like the printed card's pencil mark). */
function activeRentKey(state: GameState, pos: number): string | null {
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  if (!tile) return null;
  const ownerId = state.ownership[pos];
  const bld = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
  if (!ownerId || state.mortgaged[pos]) return null;
  if (tile.type === "street") {
    if (bld.factory) return "deed.factory";
    if (bld.hotel) return "deed.hotel";
    if (bld.houses >= 4) return "deed.house4";
    if (bld.houses === 3) return "deed.house3";
    if (bld.houses === 2) return "deed.house2";
    if (bld.houses === 1) return "deed.house1";
    return "deed.baseRent";
  }
  if (tile.type === "station") {
    const count = [5, 15, 25, 35].filter((p) => state.ownership[p] === ownerId).length;
    return count >= 4 ? "deed.rentStation4"
         : count === 3 ? "deed.rentStation3"
         : count === 2 ? "deed.rentStation2"
         : "deed.rentStation1";
  }
  if (tile.type === "attraction") {
    const attrPositions = board.tiles
      .map((tt, i) => ({ tt, i }))
      .filter(({ tt }) => tt.type === "attraction")
      .map(({ i }) => i);
    const count = attrPositions.filter((p) => state.ownership[p] === ownerId).length;
    return count >= 2 ? "deed.rentAttr2" : "deed.rentAttr1";
  }
  return null;
}

export function renderDeedCard(opts: DeedCardOptions): HTMLElement {
  const { state, pos, tr, groupColor, mini, actions, onClose, footnote, nameId, priceId } = opts;
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  const card = document.createElement("div");
  card.className = "deed-card" + (mini ? " deed-card-mini" : "");
  if (!tile) return card;

  const group = (tile as { group?: string }).group;
  const bandColor = mutePigment(
    group ? groupColor(group)
      : tile.type === "station" ? "#6b6b6b"
      : tile.type === "attraction" ? "#a8862d"
      : "#6b6b6b",
  );
  // Light bands (mistyrose, yellow, lightgreen…) get card-ink text instead of paper.
  const bandInk = luminance(bandColor) > 0.6 ? "#3a2e1c" : "#f7efe2";
  const price = tilePrice(board, tile) ?? 0;
  const active = activeRentKey(state, pos);
  const ownerId = state.ownership[pos];
  const owner = ownerId ? state.players.find((p) => p.id === ownerId) : null;
  const isMortgaged = !!state.mortgaged[pos];

  const inner = document.createElement("div");
  inner.className = "deed-inner";
  card.appendChild(inner);

  // Band: deed kind + name (+ close)
  const band = document.createElement("div");
  band.className = "deed-band";
  band.style.background = bandColor;
  band.style.color = bandInk;
  band.innerHTML = `
    <div class="deed-kind">${tr("deed.title")}</div>
    <div class="deed-name"${nameId ? ` id="${nameId}"` : ""}>${tile.name}</div>
  `;
  if (onClose) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "dc-close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", onClose);
    band.appendChild(closeBtn);
  }
  inner.appendChild(band);

  // Rent table
  const body = document.createElement("div");
  body.className = "deed-body";
  inner.appendChild(body);

  const row = (label: string, value: string, key = "") => {
    const r = document.createElement("div");
    r.className = "dc-row" + (key && key === active ? " dc-row-active" : "");
    r.innerHTML = `<span class="dc-label">${label}</span><span class="dc-value">${value}</span>`;
    body.appendChild(r);
  };

  if (tile.type === "street") {
    const st = tile as StreetTile;
    row(tr("deed.baseRent"), `${st.rent[0]} LPD`, "deed.baseRent");
    row(tr("deed.house1"), `${st.rent[1]} LPD`, "deed.house1");
    if (!mini) {
      row(tr("deed.house2"), `${st.rent[2]} LPD`, "deed.house2");
      row(tr("deed.house3"), `${st.rent[3]} LPD`, "deed.house3");
      row(tr("deed.house4"), `${st.rent[4]} LPD`, "deed.house4");
      row(tr("deed.hotel"), `${st.rent[5]} LPD`, "deed.hotel");
      row(tr("deed.factory"), `${st.factoryRevenue} LPD`, "deed.factory");
      const rule = document.createElement("hr");
      rule.className = "deed-rule";
      body.appendChild(rule);
      row(tr("deed.houseCost"), `${st.houseCost} LPD`);
      row(tr("deed.hotelCost"), `${st.hotelCost} LPD`);
      row(tr("deed.factoryCost"), `${st.factoryCost} LPD`);
      row(tr("deed.mortgage"), `${st.mortgage} LPD`);
    }
  } else if (tile.type === "station") {
    const r = board.rules.station;
    row(tr("deed.rentStation1"), `${r.rent[0] ?? 0} LPD`, "deed.rentStation1");
    row(tr("deed.rentStation2"), `${r.rent[1] ?? 0} LPD`, "deed.rentStation2");
    if (!mini) {
      row(tr("deed.rentStation3"), `${r.rent[2] ?? 0} LPD`, "deed.rentStation3");
      row(tr("deed.rentStation4"), `${r.rent[3] ?? 0} LPD`, "deed.rentStation4");
      row(tr("deed.mortgage"), `${r.mortgage} LPD`);
    }
  } else if (tile.type === "attraction") {
    const a = board.rules.attraction;
    row(tr("deed.rentAttr1"), `${tr("deed.diceX")}${a.factorOne}`, "deed.rentAttr1");
    row(tr("deed.rentAttr2"), `${tr("deed.diceX")}${a.factorBoth}`, "deed.rentAttr2");
    if (!mini) row(tr("deed.mortgage"), `${a.mortgage} LPD`);
  }

  // Owner / mortgage status
  if (owner && !mini) {
    const ownerDiv = document.createElement("div");
    ownerDiv.className = "deed-owner";
    ownerDiv.textContent = `${tr("deed.owner")} ${owner.name}`;
    body.appendChild(ownerDiv);
  }
  if (isMortgaged) {
    const m = document.createElement("div");
    m.className = "deed-mortgaged";
    m.textContent = tr("deed.mortgaged");
    body.appendChild(m);
  }

  // Price footer
  const priceRow = document.createElement("div");
  priceRow.className = "deed-price";
  priceRow.innerHTML = `<span>${tr("deed.price")}</span><span${priceId ? ` id="${priceId}"` : ""}>${price} LPD</span>`;
  inner.appendChild(priceRow);

  if (footnote) {
    const fn = document.createElement("div");
    fn.className = "deed-footnote";
    if (footnote.id) fn.id = footnote.id;
    fn.textContent = footnote.text;
    inner.appendChild(fn);
  }

  if (actions && actions.length > 0) {
    const btns = document.createElement("div");
    btns.className = "deed-actions";
    for (const a of actions) {
      const b = document.createElement("button");
      if (a.id) b.id = a.id;
      b.className = `deed-btn deed-btn-${a.kind}`;
      b.textContent = a.label;
      b.addEventListener("click", a.onClick);
      btns.appendChild(b);
    }
    inner.appendChild(btns);
  }

  return card;
}
