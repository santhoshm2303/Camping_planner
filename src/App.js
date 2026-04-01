import { useState, useEffect } from "react";
import { db, seedAll } from "./firebase";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const MEMBERS = ["SaMeg", "PraKrithi", "NagKav"];
const TABS = ["Overview", "Gear", "Meals", "Groceries", "Activities"];
const DAYS = ["Day 1 (Apr 4)", "Day 2 (Apr 5)", "Day 3 (Apr 6)"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const GROCERY_CATS = ["Vegetables", "Fruits", "Meat & Seafood", "Dairy", "Dry & Pantry", "Snacks & Drinks", "Other"];
const GEAR_CATS = ["Shelter & Sleep", "Cooking & Fire", "Sports & Games", "Clothing & Personal", "Safety & Health", "Other"];
const gearCatColors = {
  "Shelter & Sleep": "#3a65a8", "Cooking & Fire": "#c0392b", "Sports & Games": "#d4700a",
  "Clothing & Personal": "#8e44ad", "Safety & Health": "#2e7d4f", "Other": "#7f8c8d",
};
const gearCategory = (item) => {
  const n = item.toLowerCase();
  if (/tent|sleep|esky|chair|mattress|pillow|tarp|hammock/.test(n)) return "Shelter & Sleep";
  if (/stove|cook|fire|wood|log|kettle|pot|pan|grill|bbq|induction|cooktop/.test(n)) return "Cooking & Fire";
  if (/ball|bike|volley|paddle|cricket|board|chess|soccer|football|frisbee|game|card/.test(n)) return "Sports & Games";
  if (/boot|shoe|jacket|rain|sun|sunscreen|tissue|towel|cloth|wear|hat|sock/.test(n)) return "Clothing & Personal";
  if (/first aid|medical|kit|safety|torch|light|lantern|whistle/.test(n)) return "Safety & Health";
  return "Other";
};
const TRIP = { name: "Lake Leschenaultia Camping", date: "April 4–6, 2026", location: "Lake Leschenaultia, WA" };
const memberColors = { SaMeg: "#c45e38", PraKrithi: "#3a65a8", NagKav: "#2e7d4f" };
const catColors = {
  "Vegetables": "#2e7d4f", "Fruits": "#d4700a", "Meat & Seafood": "#c0392b",
  "Dairy": "#2980b9", "Dry & Pantry": "#7a5c38", "Snacks & Drinks": "#8e44ad", "Other": "#7f8c8d"
};

const IS = { background: "#fff", border: "1px solid #d4c9b8", borderRadius: 8, padding: "9px 12px", color: "#2d2a24", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%" };
const SS = { ...IS, cursor: "pointer", width: "auto" };

const Avatar = ({ name, size = 26 }) => (
  <span title={name} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: memberColors[name] || "#888", color: "#fff", fontSize: size * 0.36, fontWeight: 700, fontFamily: "Georgia,serif", flexShrink: 0 }}>
    {name.slice(0, 2)}
  </span>
);

const Badge = ({ label, color }) => (
  <span style={{ background: color + "18", color, border: `1px solid ${color}40`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600, letterSpacing: "0.03em" }}>{label}</span>
);

const FamilyChecks = ({ confirmed, onToggle }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
    {MEMBERS.map(m => {
      const checked = confirmed?.[m] || false;
      const c = memberColors[m];
      return (
        <button key={m} onClick={() => onToggle(m)} title={`${m} ${checked ? "confirmed" : "tap to confirm"}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", cursor: "pointer", padding: 2 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, border: checked ? "none" : `2px solid ${c}60`, background: checked ? c : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", boxShadow: checked ? `0 1px 4px ${c}60` : "none" }}>
            {checked && <span style={{ fontSize: 12, color: "#fff", fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: checked ? c : "#c0b8b0" }}>{m.slice(0, 2)}</span>
        </button>
      );
    })}
  </div>
);


const FamilyChecksWithEdit = ({ confirmed, onToggle, onEdit }) => (
  <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
    {["SaMeg","PraKrithi","NagKav"].map(m => {
      const checked = confirmed?.[m] || false;
      const c = memberColors[m];
      return (
        <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button onClick={() => onToggle(m)} style={{ width:24, height:24, borderRadius:6, flexShrink:0, cursor:"pointer", border:checked?"none":`2px solid ${c}60`, background:checked?c:"#fff", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", boxShadow:checked?`0 1px 4px ${c}60`:"none" }}>
              {checked && <span style={{ fontSize:11, color:"#fff", fontWeight:900 }}>✓</span>}
            </button>
            <button onClick={() => onEdit(m)} style={{ background:checked?`${c}18`:"#f5f0e8", border:`1px solid ${checked?c+"40":"#e0d8cc"}`, borderRadius:5, width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:10, flexShrink:0 }}>✏️</button>
          </div>
          <span style={{ fontSize:8, fontWeight:700, color:checked?c:"#c0b8b0" }}>{m.slice(0,2)}</span>
        </div>
      );
    })}
  </div>
);

const EditDrawer = ({ children }) => (
  <div style={{ background: "#fffdf8", border: "1px solid #d4c9b8", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "14px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.08)", marginBottom: 6 }}>
    {children}
  </div>
);

const IBtn = ({ onClick, title, emoji }) => (
  <button title={title} onClick={onClick} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "5px 6px", borderRadius: 6, fontSize: 14, flexShrink: 0 }}>{emoji}</button>
);

const rowBase = (editing, border) => ({
  background: editing ? "#f0f7ec" : "#fff",
  border: editing ? "1px solid #7ab87a" : (border || "1px solid #e8e0d4"),
  borderBottom: editing ? "none" : undefined,
  borderRadius: editing ? "11px 11px 0 0" : 11,
  padding: "11px 13px", display: "flex", flexDirection: "row", alignItems: "center", gap: 9,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
});

const Spinner = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 14 }}>
    <div style={{ width: 32, height: 32, border: "3px solid #d4c9b8", borderTopColor: "#3a7a4a", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <span style={{ fontSize: 13, color: "#9a8a7a" }}>Loading your trip data…</span>
  </div>
);

const ViewToggle = ({ tileView, onSwitch }) => (
  <div style={{ display: "flex", gap: 3, background: "#f0ece4", borderRadius: 20, padding: 3 }}>
    {[{ v: false, icon: "☰" }, { v: true, icon: "⊞" }].map(({ v, icon }) => (
      <button key={String(v)} onClick={() => onSwitch(v)} style={{ background: tileView === v ? "#fff" : "transparent", border: tileView === v ? "1.5px solid #d4c9b8" : "1.5px solid transparent", borderRadius: 17, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: tileView === v ? "#2d2a24" : "#9a8a7a", fontWeight: tileView === v ? 700 : 400 }}>{icon}</button>
    ))}
  </div>
);

const TileGrid = ({ groups, onDrill }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
    {groups.map(({ cat, color, icon, items, countLabel, doneCount }) => (
      <button key={cat} onClick={() => onDrill(cat)} style={{ background: "#fff", border: `2px solid ${color}30`, borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 4, bottom: 0, background: color, borderRadius: "14px 0 0 14px" }} />
        <div style={{ paddingLeft: 8 }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2d2a24", marginBottom: 4, lineHeight: 1.2 }}>{cat}</div>
          <div style={{ fontSize: 11, color: "#9a8a7a", marginBottom: 8 }}>{doneCount}/{items.length} {countLabel}</div>
          <div style={{ background: "#e8e0d4", borderRadius: 10, height: 5, overflow: "hidden" }}>
            <div style={{ width: `${items.length ? doneCount / items.length * 100 : 0}%`, height: "100%", background: color, borderRadius: 10 }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color, fontWeight: 600 }}>Tap to view →</div>
        </div>
      </button>
    ))}
  </div>
);


const fmt = (n) => `A$${(n || 0).toFixed(2)}`;

const BudgetSummary = ({ groceries, memberColors, catColors, onBack }) => {
  const itemsWithCost = groceries.map(g => ({ ...g, total: g.bought ? (parseFloat(g.actualPrice) || parseFloat(g.price) || 0) : 0, buyers: ["SaMeg","PraKrithi","NagKav"].filter(m => g.confirmed?.[m]), actualQty: g.actualQty || g.qty || "" }));
  const grandTotal = itemsWithCost.reduce((s,g) => s+g.total, 0);
  const byEqual = {"SaMeg":0,"PraKrithi":0,"NagKav":0};
  const byBuyer = {"SaMeg":0,"PraKrithi":0,"NagKav":0};
  itemsWithCost.forEach(g => {
    const buyers = g.buyers.length ? g.buyers : ["SaMeg","PraKrithi","NagKav"];
    buyers.forEach(m => { byEqual[m] += g.total/buyers.length; });
    if (g.buyers.length) { const share = g.total/g.buyers.length; g.buyers.forEach(m => { byBuyer[m] += share; }); }
  });
  const byCat = {};
  itemsWithCost.forEach(g => { byCat[g.category] = (byCat[g.category]||0)+g.total; });
  return (
    <div style={{ minHeight:"100vh", background:"#f5f0e8", fontFamily:"'DM Sans',sans-serif", color:"#2d2a24", paddingBottom:60 }}>
      <div style={{ background:"linear-gradient(135deg,#3a65a8,#2a4a88)", padding:"28px 20px 24px" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.4)", borderRadius:20, padding:"6px 14px", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>◀ Back to Groceries</button>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#fff", marginBottom:4 }}>Budget Summary 💰</h1>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>Lake Leschenaultia · April 4–6, 2026</div>
      </div>
      <div style={{ padding:"16px" }}>
        <div style={{ background:"linear-gradient(135deg,#3a65a8,#2a4a88)", borderRadius:14, padding:"18px", textAlign:"center", marginBottom:16, boxShadow:"0 4px 16px rgba(58,101,168,0.3)" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>Grand Total</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:900, color:"#fff" }}>{fmt(grandTotal)}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:4 }}>{itemsWithCost.filter(x=>x.bought).length}/{groceries.length} items bought</div>
        </div>
        <div style={{ background:"#fff", border:"1px solid #e8e0d4", borderRadius:14, padding:"16px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#9a8a7a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Cost per Family</div>
          <div style={{ fontSize:11, color:"#3a65a8", fontWeight:700, marginBottom:8 }}>① Split equally among buyers</div>
          {["SaMeg","PraKrithi","NagKav"].map(m => (
            <div key={m} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:memberColors[m], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>{m.slice(0,2)}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{m}</div><div style={{ background:"#e8e0d4", borderRadius:10, height:5, marginTop:3, overflow:"hidden" }}><div style={{ width:`${grandTotal ? byEqual[m]/grandTotal*100 : 0}%`, height:"100%", background:memberColors[m], borderRadius:10 }} /></div></div>
              <div style={{ fontSize:14, fontWeight:700, color:memberColors[m], minWidth:64, textAlign:"right" }}>{fmt(byEqual[m])}</div>
            </div>
          ))}
          <div style={{ borderTop:"1px dashed #e8e0d4", margin:"12px 0" }} />
          <div style={{ fontSize:11, color:"#c45e38", fontWeight:700, marginBottom:8 }}>② Full cost to whoever buys it</div>
          {["SaMeg","PraKrithi","NagKav"].map(m => (
            <div key={m} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:memberColors[m], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>{m.slice(0,2)}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{m}</div><div style={{ background:"#e8e0d4", borderRadius:10, height:5, marginTop:3, overflow:"hidden" }}><div style={{ width:`${grandTotal ? byBuyer[m]/grandTotal*100 : 0}%`, height:"100%", background:memberColors[m], borderRadius:10 }} /></div></div>
              <div style={{ fontSize:14, fontWeight:700, color:memberColors[m], minWidth:64, textAlign:"right" }}>{fmt(byBuyer[m])}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff", border:"1px solid #e8e0d4", borderRadius:14, padding:"16px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#9a8a7a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>By Category</div>
          {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,total]) => (
            <div key={cat} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:3, height:30, background:catColors[cat]||"#888", borderRadius:3, flexShrink:0 }} />
              <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{cat}</div><div style={{ background:"#e8e0d4", borderRadius:10, height:5, marginTop:3, overflow:"hidden" }}><div style={{ width:`${grandTotal ? total/grandTotal*100 : 0}%`, height:"100%", background:catColors[cat]||"#888", borderRadius:10 }} /></div></div>
              <div style={{ fontSize:13, fontWeight:700, color:catColors[cat]||"#888", minWidth:64, textAlign:"right" }}>{fmt(total)}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff", border:"1px solid #e8e0d4", borderRadius:14, padding:"16px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#9a8a7a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Item Breakdown</div>
          {itemsWithCost.sort((a,b)=>b.total-a.total).map(g => (
            <div key={g.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f0ece4", opacity: g.bought ? 1 : 0.45 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                  {g.item}
                  {!g.bought && <span style={{ fontSize:9, color:"#b0a090", fontWeight:600, background:"#f0ece4", borderRadius:8, padding:"1px 6px" }}>not bought yet</span>}
                </div>
                <div style={{ fontSize:10, color:"#b0a090", marginTop:2 }}>
                  {g.actualQty ? <span style={{ color:"#3a7a4a", fontWeight:600 }}>{g.actualQty}</span> : g.qty ? <span>{g.qty}</span> : null}
                  {(g.actualQty || g.qty) && " · "}
                  <span style={{ color:catColors[g.category]||"#888" }}>{g.category}</span>
                  {g.buyers.length>0 && <span> · {g.buyers.join(", ")}</span>}
                </div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color: g.bought ? "#2d2a24" : "#b0a090", minWidth:64, textAlign:"right" }}>
                {g.bought ? fmt(g.total) : <span style={{ fontSize:11 }}>est. {fmt(parseFloat(g.price)||0)}</span>}
              </div>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, marginTop:4 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>Total</span>
            <span style={{ fontSize:15, fontWeight:900, color:"#3a65a8", fontFamily:"'Playfair Display',serif" }}>{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState("Overview");
  const [who, setWho] = useState("SaMeg");
  const [tileView, setTileView] = useState(false);
  const [drillCat, setDrillCat] = useState(null);
  const [collapsedGear, setCollapsedGear] = useState({});
  const [collapsedGroc, setCollapsedGroc] = useState({});
  const toggleGearGroup = (cat) => setCollapsedGear(v => ({ ...v, [cat]: !v[cat] }));
  const toggleGrocGroup = (cat) => setCollapsedGroc(v => ({ ...v, [cat]: !v[cat] }));
  const switchTab = (t) => { setTab(t); setDrillCat(null); };
  const switchView = (v) => { setTileView(v); setDrillCat(null); };
  const [loading, setLoading] = useState(true);

  const [gear, setGear] = useState([]);
  const [meals, setMeals] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [acts, setActs] = useState([]);

  const [egId, setEgId] = useState(null); const [eg, setEg] = useState({});
  const [addGearOpen, setAddGearOpen] = useState(false);
  const [ngItem, setNgItem] = useState(""); const [ngTo, setNgTo] = useState("SaMeg"); const [ngCat, setNgCat] = useState("Other");

  const [emId, setEmId] = useState(null); const [em, setEm] = useState({});
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [nmName, setNmName] = useState(""); const [nmDay, setNmDay] = useState(DAYS[0]); const [nmType, setNmType] = useState("Dinner");

  const [grpId, setGrpId] = useState(null); const [gr, setGr] = useState({});
  const [addGrocOpen, setAddGrocOpen] = useState(false);
  const [ggItem, setGgItem] = useState(""); const [ggQty, setGgQty] = useState(""); const [ggCat, setGgCat] = useState("Vegetables"); const [ggMeal, setGgMeal] = useState(""); const [ggPrice, setGgPrice] = useState("");
  const [grocFilter, setGrocFilter] = useState("All");
  const [showBudget, setShowBudget] = useState(false);
  const [purchasePopup, setPurchasePopup] = useState(null);
  const [actualQty, setActualQty] = useState("");
  const [actualPrice, setActualPrice] = useState("");

  const [eaId, setEaId] = useState(null); const [ea, setEa] = useState({});
  const [addActOpen, setAddActOpen] = useState(false);
  const [naName, setNaName] = useState(""); const [naDay, setNaDay] = useState(DAYS[0]);

  useEffect(() => {
    seedAll().then(() => {
      let loaded = { gear: false, meals: false, groceries: false, activities: false };
      const check = (k) => { loaded[k] = true; if (Object.values(loaded).every(Boolean)) setLoading(false); };
      const u1 = onSnapshot(collection(db, "gear"), s => { setGear(s.docs.map(d => ({ id: d.id, ...d.data() }))); check("gear"); });
      const u2 = onSnapshot(collection(db, "meals"), s => { setMeals(s.docs.map(d => ({ id: d.id, ...d.data() }))); check("meals"); });
      const u3 = onSnapshot(collection(db, "groceries"), s => { setGroceries(s.docs.map(d => ({ id: d.id, ...d.data() }))); check("groceries"); });
      const u4 = onSnapshot(collection(db, "activities"), s => { setActs(s.docs.map(d => ({ id: d.id, ...d.data() }))); check("activities"); });
      return () => { u1(); u2(); u3(); u4(); };
    });
  }, []);

  const noConfirm = { SaMeg: false, PraKrithi: false, NagKav: false };

  // Gear
  const togglePacked = (id, cur) => updateDoc(doc(db, "gear", id), { packed: !cur });
  const toggleGearConfirm = (id, member, cur) => updateDoc(doc(db, "gear", id), { [`confirmed.${member}`]: !cur });
  const addGear = async () => { if (!ngItem.trim()) return; await addDoc(collection(db, "gear"), { item: ngItem, assignedTo: ngTo, addedBy: who, packed: false, confirmed: noConfirm, category: ngCat || gearCategory(ngItem) }); setNgItem(""); setAddGearOpen(false); };
  const saveGear = async (id) => { if (!eg.item?.trim()) return; await updateDoc(doc(db, "gear", id), { item: eg.item, assignedTo: eg.assignedTo }); setEgId(null); };
  const delGear = async (id) => { await deleteDoc(doc(db, "gear", id)); setEgId(null); };

  // Meals
  const toggleMealConfirm = (id, member, cur) => updateDoc(doc(db, "meals", id), { [`confirmed.${member}`]: !cur });
  const addMeal = async () => { if (!nmName.trim()) return; await addDoc(collection(db, "meals"), { name: nmName, day: nmDay, meal: nmType, chef: who, confirmed: noConfirm }); setNmName(""); setAddMealOpen(false); };
  const saveMeal = async (id) => { if (!em.name?.trim()) return; await updateDoc(doc(db, "meals", id), em); setEmId(null); };
  const delMeal = async (id) => { await deleteDoc(doc(db, "meals", id)); setEmId(null); };

  // Groceries
  const toggleBought = (id, cur, item) => {
    if (cur) {
      updateDoc(doc(db, "groceries", id), { bought: false, actualQty: "", actualPrice: 0 });
    } else {
      setPurchasePopup({ id, item: item.item, plannedPrice: item.price || 0, member: null });
      setActualQty(item.qty || "");
      setActualPrice(item.price ? String(item.price) : "");
    }
  };
  const openFamilyEdit = (id, member, item) => {
    if (!item.confirmed?.[member]) updateDoc(doc(db, "groceries", id), { [`confirmed.${member}`]: true });
    setPurchasePopup({ id, item: item.item, plannedPrice: item.price || 0, member });
    setActualQty(item.memberSpend?.[member]?.qty || item.qty || "");
    setActualPrice(item.memberSpend?.[member]?.price ? String(item.memberSpend[member].price) : item.price ? String(item.price) : "");
  };
  const confirmPurchase = () => {
    if (!purchasePopup) return;
    const g = groceries.find(x => x.id === purchasePopup.id); if (!g) return;
    const memberSpend = { ...(g.memberSpend || {}) };
    if (purchasePopup.member) {
      memberSpend[purchasePopup.member] = { qty: actualQty, price: parseFloat(actualPrice) || 0 };
      const totalActual = Object.values(memberSpend).reduce((s, v) => s + (v.price || 0), 0);
      updateDoc(doc(db, "groceries", purchasePopup.id), { bought: true, actualQty, actualPrice: totalActual, memberSpend });
    } else {
      updateDoc(doc(db, "groceries", purchasePopup.id), { bought: true, actualQty, actualPrice: parseFloat(actualPrice) || g.price || 0 });
    }
    setPurchasePopup(null); setActualQty(""); setActualPrice("");
  };
  const skipPurchase = () => {
    if (!purchasePopup) return;
    updateDoc(doc(db, "groceries", purchasePopup.id), { bought: true });
    setPurchasePopup(null); setActualQty(""); setActualPrice("");
  };
  const toggleGrocConfirm = (id, member, cur) => updateDoc(doc(db, "groceries", id), { [`confirmed.${member}`]: !cur });
  const addGroc = async () => { if (!ggItem.trim()) return; await addDoc(collection(db, "groceries"), { item: ggItem, qty: ggQty, price: parseFloat(ggPrice)||0, category: ggCat, forMeal: ggMeal, addedBy: who, bought: false, confirmed: noConfirm }); setGgItem(""); setGgQty(""); setGgMeal(""); setGgPrice(""); setAddGrocOpen(false); };
  const saveGroc = async (id) => { if (!gr.item?.trim()) return; await updateDoc(doc(db, "groceries", id), gr); setGrpId(null); };
  const delGroc = async (id) => { await deleteDoc(doc(db, "groceries", id)); setGrpId(null); };

  // Activities
  const addAct = async () => { if (!naName.trim()) return; await addDoc(collection(db, "activities"), { name: naName, day: naDay, suggestedBy: who, votes: 1, votedBy: [who] }); setNaName(""); setAddActOpen(false); };
  const saveAct = async (id) => { if (!ea.name?.trim()) return; await updateDoc(doc(db, "activities", id), ea); setEaId(null); };
  const delAct = async (id) => { await deleteDoc(doc(db, "activities", id)); setEaId(null); };
  const toggleVote = (id, votedBy, votes) => {
    const voted = (votedBy || []).includes(who);
    updateDoc(doc(db, "activities", id), { votes: voted ? votes - 1 : votes + 1, votedBy: voted ? votedBy.filter(m => m !== who) : [...(votedBy || []), who] });
  };

  const packed = gear.filter(g => g.packed).length;
  const bought = groceries.filter(g => g.bought).length;
  const mealNames = ["(General)", ...meals.map(m => m.name)];

  const personFilter = (items, assignField) => who === "All" ? items : items.filter(x =>
    x[assignField] === who || x.addedBy === who || (x.confirmed && x.confirmed[who])
  );
  const visibleGear = personFilter(gear, "assignedTo");
  const visibleMeals = personFilter(meals, "chef");
  const visibleGroceries = personFilter(groceries, "addedBy");

  const filteredGroceries = grocFilter === "All" ? visibleGroceries : grocFilter === "Bought" ? visibleGroceries.filter(g => g.bought) : grocFilter === "Needed" ? visibleGroceries.filter(g => !g.bought) : visibleGroceries.filter(g => g.category === grocFilter);
  const daysLeft = Math.max(0, Math.ceil((new Date("2026-04-04") - new Date()) / 86400000));

  if (showBudget) return <BudgetSummary groceries={groceries} memberColors={memberColors} catColors={catColors} onBack={() => setShowBudget(false)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'DM Sans',sans-serif", color: "#2d2a24", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#c4b89a;border-radius:4px}
        .pill:hover{transform:translateY(-1px)}
        .abtn{background:#fff;color:#3a7a4a;border:1.5px solid #7ab87a;border-radius:20px;padding:7px 15px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif}
        .abtn:hover{background:#3a7a4a;color:#fff}
        .sbtn{background:#3a7a4a;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-weight:700;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif}
        .sbtn:hover{background:#2d6038}
        .clnk{background:transparent;border:none;color:#8a7a6a;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0}
        .row:hover{background:#faf7f2 !important}
        .fchip{background:#fff;border:1.5px solid #d4c9b8;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;color:#6a6058}
        .fchip.active{background:#e8f4ec;border-color:#3a7a4a;color:#3a7a4a}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#a0d890;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        input::placeholder{color:#b0a898}
        select option{background:#fff;color:#2d2a24}
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#3a7a4a,#2d6038)", padding: "34px 22px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, opacity: 0.15, pointerEvents: "none" }}>
          {[...Array(16)].map((_, i) => <div key={i} style={{ position: "absolute", bottom: 0, left: `${i * 6.5}%`, width: 0, height: 0, borderLeft: `${10 + (i % 3) * 4}px solid transparent`, borderRight: `${10 + (i % 3) * 4}px solid transparent`, borderBottom: `${36 + (i % 4) * 10}px solid #fff` }} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>⛺</span>
          <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", fontWeight: 700 }}>Camp Planner</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
            <div className="live-dot" /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>Live</span>
          </div>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 5 }}>{TRIP.name}</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>📅 {TRIP.date}</span>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>📍 {TRIP.location}</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Filter by</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {["All", ...MEMBERS].map(m => { const a = who === m; const c = m === "All" ? "#fff" : memberColors[m]; return (
            <button key={m} className="pill" onClick={() => setWho(m)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: a ? "3px solid #1a1a1a" : "2px solid #d0c8bc", borderRadius: 20, padding: m === "All" ? "5px 14px" : "5px 12px 5px 5px", cursor: "pointer", transition: "all 0.2s" }}>
              {m !== "All" && <Avatar name={m} size={22} />}
              <span style={{ fontSize: 12, fontWeight: a ? 700 : 600, color: a ? (m === "All" ? "#2d2a24" : c) : "#2d2a24" }}>{m}</span>
            </button>
          ); })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "10px 14px", background: "#fff", borderBottom: "1px solid #e8e0d4", overflowX: "auto", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {TABS.map(t => <button key={t} onClick={() => switchTab(t)} style={{ background: "#fff", color: "#2d2a24", border: tab === t ? "3px solid #1a1a1a" : "2px solid #ccc3b4", borderRadius: 20, padding: "7px 15px", fontSize: 12, fontWeight: tab === t ? 700 : 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" }}>{t}</button>)}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {loading && <Spinner />}

        {/* OVERVIEW */}
        {!loading && tab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              { icon: "🎒", label: "Gear Packed", value: `${packed}/${gear.length}`, color: "#3a7a4a", bg: "#e8f4ec" },
              { icon: "🍳", label: "Meals Planned", value: meals.length, color: "#c45e38", bg: "#fbe9e2" },
              { icon: "🛒", label: "Groceries", value: `${bought}/${groceries.length} bought`, color: "#3a65a8", bg: "#e2eaf8" },
              { icon: "🥾", label: "Activities", value: acts.length, color: "#7a4a9a", bg: "#f0e8f8" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 13, padding: "13px 16px", display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#6a6058" }}>{s.label}</div>
                </div>
              </div>
            ))}
            <div style={{ background: "linear-gradient(135deg,#3a7a4a,#2d6038)", borderRadius: 13, padding: "16px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 42, fontWeight: 900, color: "#fff" }}>{daysLeft}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Days Until Adventure</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e8e0d4", borderRadius: 13, padding: "13px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Grocery Progress</span>
                <span style={{ fontSize: 12, color: "#3a65a8", fontWeight: 700 }}>{groceries.length ? Math.round(bought / groceries.length * 100) : 0}%</span>
              </div>
              <div style={{ background: "#e8e0d4", borderRadius: 10, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${groceries.length ? bought / groceries.length * 100 : 0}%`, height: "100%", background: "linear-gradient(90deg,#3a65a8,#6a95d8)", borderRadius: 10, transition: "width 0.4s" }} />
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e8e0d4", borderRadius: 13, padding: "13px 16px" }}>
              <div style={{ fontSize: 10, color: "#9a8a7a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Collaborators</div>
              <div style={{ display: "flex", gap: 16 }}>
                {MEMBERS.map(m => <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}><Avatar name={m} size={38} /><span style={{ fontSize: 11, color: memberColors[m], fontWeight: 700 }}>{m}</span></div>)}
              </div>
            </div>
          </div>
        )}

        {/* GEAR */}
        {!loading && tab === "Gear" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>
                {drillCat ? <button onClick={() => setDrillCat(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, fontFamily: "'Playfair Display',serif", color: "#2d2a24", padding: 0 }}>◀ {drillCat}</button> : <>Gear List <span style={{ fontSize: 12, color: "#9a8a7a", fontFamily: "'DM Sans',sans-serif" }}>({packed}/{gear.length})</span></>}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!drillCat && <ViewToggle tileView={tileView} onSwitch={switchView} />}
                <button className="abtn" onClick={() => { setAddGearOpen(v => !v); setEgId(null); }}>+ Add</button>
              </div>
            </div>
            {!drillCat && !tileView && (
              <div style={{ display: "flex", gap: 10, marginBottom: 12, padding: "8px 12px", background: "#fff", borderRadius: 10, border: "1px solid #e8e0d4", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#9a8a7a", fontWeight: 600 }}>Who's bringing it:</span>
                {MEMBERS.map(m => <div key={m} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: memberColors[m] }} /><span style={{ fontSize: 11, color: memberColors[m], fontWeight: 600 }}>{m}</span></div>)}
              </div>
            )}
            {addGearOpen && (
              <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderRadius: 12, padding: "16px", marginBottom: 8, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 11, color: memberColors[who === "All" ? "SaMeg" : who], fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}><Avatar name={who === "All" ? "SaMeg" : who} size={16} /> Adding item</div>
                <input value={ngItem} onChange={e => { setNgItem(e.target.value); setNgCat(gearCategory(e.target.value)); }} onKeyDown={e => e.key === "Enter" && addGear()} placeholder="e.g. Sunscreen, Cricket set…" style={IS} autoFocus />
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={ngCat} onChange={e => setNgCat(e.target.value)} style={{ ...SS, flex: 1 }}>{GEAR_CATS.map(c => <option key={c}>{c}</option>)}</select>
                  <select value={ngTo} onChange={e => setNgTo(e.target.value)} style={{ ...SS, flex: 1 }}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select>
                </div>
                <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={addGear}>Add Item</button><button className="clnk" onClick={() => setAddGearOpen(false)}>✕ Cancel</button></div>
              </div>
            )}
            {tileView && !drillCat && (() => {
              const icons = { "Shelter & Sleep":"🏕️","Cooking & Fire":"🔥","Sports & Games":"⚽","Clothing & Personal":"👟","Safety & Health":"🩺","Other":"📦" };
              return <TileGrid onDrill={setDrillCat} groups={GEAR_CATS.map(cat => { const items = visibleGear.filter(g=>(g.category||gearCategory(g.item))===cat); return { cat, color: gearCatColors[cat], icon: icons[cat]||"📦", items, countLabel:"packed", doneCount: items.filter(x=>x.packed).length }; }).filter(g=>g.items.length>0)} />;
            })()}
            {(!tileView || drillCat) && GEAR_CATS.map(cat => {
              if (drillCat && drillCat !== cat) return null;
              const items = visibleGear.filter(g => (g.category || gearCategory(g.item)) === cat);
              if (!items.length) return null;
              const cc = gearCatColors[cat];
              const collapsed = !drillCat && collapsedGear[cat];
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  {!drillCat && (
                    <button onClick={() => toggleGearGroup(cat)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "6px 2px", marginBottom: collapsed ? 0 : 6 }}>
                      <div style={{ width: 3, height: 14, background: cc, borderRadius: 3, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: cc, textTransform: "uppercase", flex: 1, textAlign: "left" }}>{cat}</span>
                      <span style={{ fontSize: 10, color: "#b0a090" }}>({items.filter(x => x.packed).length}/{items.length})</span>
                      <span style={{ fontSize: 12, color: cc, marginLeft: 6 }}>{collapsed ? "▶" : "▼"}</span>
                    </button>
                  )}
                  {!collapsed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {items.map(g => { const editing = egId === g.id; const conf = g.confirmed || {}; return (
                        <div key={g.id}>
                          <div className="row" style={rowBase(editing, g.packed ? "1px solid #7ab87a" : undefined)}>
                            <button onClick={() => togglePacked(g.id, g.packed)} style={{ width: 20, height: 20, borderRadius: 5, border: g.packed ? "none" : "2px solid #b0c8b0", background: g.packed ? "#3a7a4a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                              {g.packed && <span style={{ fontSize: 10, color: "#fff", fontWeight: 900 }}>✓</span>}
                            </button>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: g.packed ? "#a09080" : "#2d2a24", textDecoration: g.packed ? "line-through" : "none" }}>{g.item}</span>
                            <FamilyChecks confirmed={conf} onToggle={m => toggleGearConfirm(g.id, m, conf[m])} />
                            <IBtn emoji="✏️" title="Edit" onClick={() => editing ? setEgId(null) : (setEg({ item: g.item, assignedTo: g.assignedTo, category: g.category || gearCategory(g.item) }), setEgId(g.id), setAddGearOpen(false))} />
                            <IBtn emoji="🗑" title="Delete" onClick={() => delGear(g.id)} />
                          </div>
                          {editing && <EditDrawer>
                            <input value={eg.item} onChange={e => setEg(v => ({ ...v, item: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveGear(g.id)} style={IS} autoFocus />
                            <div style={{ display: "flex", gap: 8 }}>
                              <select value={eg.category || gearCategory(eg.item || "")} onChange={e => setEg(v => ({ ...v, category: e.target.value }))} style={{ ...SS, flex: 1 }}>{GEAR_CATS.map(c => <option key={c}>{c}</option>)}</select>
                              <select value={eg.assignedTo} onChange={e => setEg(v => ({ ...v, assignedTo: e.target.value }))} style={{ ...SS, flex: 1 }}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={() => saveGear(g.id)}>Save</button><button className="clnk" onClick={() => setEgId(null)}>✕ Cancel</button></div>
                          </EditDrawer>}
                        </div>
                      ); })}
                    </div>
                  )}
                </div>
              );
            })}
            <p style={{ marginTop: 10, fontSize: 11, color: "#b0a090", textAlign: "center" }}>Tap coloured boxes to volunteer · ✏️ edit · 🗑 delete</p>
          </div>
        )}

        {/* MEALS */}
        {!loading && tab === "Meals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>
                {drillCat ? <button onClick={() => setDrillCat(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, fontFamily: "'Playfair Display',serif", color: "#2d2a24", padding: 0 }}>◀ {drillCat}</button> : "Meal Plan 🍽️"}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!drillCat && <ViewToggle tileView={tileView} onSwitch={switchView} />}
                <button className="abtn" onClick={() => { setAddMealOpen(v => !v); setEmId(null); }}>+ Add Meal</button>
              </div>
            </div>
            {addMealOpen && (
              <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderRadius: 12, padding: "16px", marginBottom: 8, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 11, color: memberColors[who], fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}><Avatar name={who} size={16} /> {who} is cooking</div>
                <input value={nmName} onChange={e => setNmName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMeal()} placeholder="e.g. Grilled corn & burgers…" style={IS} autoFocus />
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={nmDay} onChange={e => setNmDay(e.target.value)} style={{ ...SS, flex: 1 }}>{DAYS.map(d => <option key={d}>{d}</option>)}</select>
                  <select value={nmType} onChange={e => setNmType(e.target.value)} style={{ ...SS, flex: 1 }}>{MEAL_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={addMeal}>Add Meal</button><button className="clnk" onClick={() => setAddMealOpen(false)}>✕ Cancel</button></div>
              </div>
            )}
            {tileView && !drillCat && (() => {
              const dc = {"Day 1 (Apr 4)":"#c45e38","Day 2 (Apr 5)":"#2e7d4f","Day 3 (Apr 6)":"#3a65a8"};
              const di = {"Day 1 (Apr 4)":"🌊","Day 2 (Apr 5)":"🌲","Day 3 (Apr 6)":"☀️"};
              return <TileGrid onDrill={setDrillCat} groups={DAYS.map(day => { const items = visibleMeals.filter(m=>m.day===day); return { cat:day, color:dc[day]||"#3a7a4a", icon:di[day]||"🍽️", items, countLabel:"meals", doneCount:items.length }; }).filter(g=>g.items.length>0)} />;
            })()}
            {(!tileView || drillCat) && DAYS.map(day => {
              if (drillCat && drillCat !== day) return null;
              const dm = visibleMeals.filter(m => m.day === day); return (
              <div key={day} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#3a7a4a", textTransform: "uppercase", marginBottom: 7, paddingLeft: 2 }}>{day}</div>
                {dm.length === 0
                  ? <div style={{ background: "#fff", border: "1px dashed #d4c9b8", borderRadius: 11, padding: "14px", color: "#b0a090", fontSize: 12, textAlign: "center" }}>No meals yet — add one!</div>
                  : dm.map(m => { const mc = { Breakfast: "#c45e38", Lunch: "#a07820", Dinner: "#2e7d4f", Snacks: "#8e44ad" }[m.meal] || "#2e7d4f"; const mbg = { Breakfast: "#fbe9e2", Lunch: "#faf3e0", Dinner: "#e2f2e9", Snacks: "#f0e8f8" }[m.meal] || "#e2f2e9"; const mi = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🔥", Snacks: "🍎" }[m.meal] || "🍴"; const conf = m.confirmed || {}; const editing = emId === m.id; return (
                    <div key={m.id} style={{ marginBottom: 5 }}>
                      <div className="row" style={rowBase(editing)}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: mbg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{mi}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{m.name}</div>
                          <Badge label={m.meal} color={mc} />
                        </div>
                        <FamilyChecks confirmed={conf} onToggle={member => toggleMealConfirm(m.id, member, conf[member])} />
                        <IBtn emoji="✏️" title="Edit" onClick={() => editing ? setEmId(null) : (setEm({ name: m.name, day: m.day, meal: m.meal, chef: m.chef }), setEmId(m.id), setAddMealOpen(false))} />
                        <IBtn emoji="🗑" title="Delete" onClick={() => delMeal(m.id)} />
                      </div>
                      {editing && <EditDrawer>
                        <input value={em.name} onChange={e => setEm(v => ({ ...v, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveMeal(m.id)} style={IS} autoFocus />
                        <div style={{ display: "flex", gap: 8 }}>
                          <select value={em.day} onChange={e => setEm(v => ({ ...v, day: e.target.value }))} style={{ ...SS, flex: 1 }}>{DAYS.map(d => <option key={d}>{d}</option>)}</select>
                          <select value={em.meal} onChange={e => setEm(v => ({ ...v, meal: e.target.value }))} style={{ ...SS, flex: 1 }}>{MEAL_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#6a6058", whiteSpace: "nowrap" }}>Chef:</span>
                          <select value={em.chef} onChange={e => setEm(v => ({ ...v, chef: e.target.value }))} style={{ ...SS, flex: 1 }}>{MEMBERS.map(mem => <option key={mem}>{mem}</option>)}</select>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={() => saveMeal(m.id)}>Save</button><button className="clnk" onClick={() => setEmId(null)}>✕ Cancel</button></div>
                      </EditDrawer>}
                    </div>
                  ); })}
              </div>
            ); })}
          </div>
        )}

        {/* GROCERIES */}
        {!loading && tab === "Groceries" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>
                {drillCat ? <button onClick={() => setDrillCat(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, fontFamily: "'Playfair Display',serif", color: "#2d2a24", padding: 0 }}>◀ {drillCat}</button> : <>Groceries 🛒 <span style={{ fontSize: 12, color: "#9a8a7a", fontFamily: "'DM Sans',sans-serif" }}>({bought}/{groceries.length})</span></>}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!drillCat && <ViewToggle tileView={tileView} onSwitch={switchView} />}
                <button onClick={() => setShowBudget(true)} style={{ background: "#e2eaf8", color: "#3a65a8", border: "1.5px solid #3a65a8", borderRadius: 20, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>💰 Budget</button>
                <button className="abtn" onClick={() => { setAddGrocOpen(v => !v); setGrpId(null); }}>+ Add</button>
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e8e0d4", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ background: "#e8e0d4", borderRadius: 10, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${groceries.length ? bought / groceries.length * 100 : 0}%`, height: "100%", background: "linear-gradient(90deg,#3a65a8,#6a95d8)", borderRadius: 10, transition: "width 0.4s" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {["All", "Needed", "Bought", ...GROCERY_CATS].map(f => (
                <button key={f} className={`fchip${grocFilter === f ? " active" : ""}`} onClick={() => setGrocFilter(f)}>{f}</button>
              ))}
            </div>
            {addGrocOpen && (
              <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderRadius: 12, padding: "16px", marginBottom: 10, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 11, color: memberColors[who], fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}><Avatar name={who} size={16} /> {who} is adding</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={ggItem} onChange={e => setGgItem(e.target.value)} placeholder="Item name" style={{ ...IS, flex: 2 }} autoFocus />
                  <input value={ggQty} onChange={e => setGgQty(e.target.value)} placeholder="Qty" style={{ ...IS, flex: 1 }} />
                  <input value={ggPrice} onChange={e => setGgPrice(e.target.value)} placeholder="A$" type="number" min="0" step="0.50" style={{ ...IS, flex: 1 }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={ggCat} onChange={e => setGgCat(e.target.value)} style={{ ...SS, flex: 1 }}>{GROCERY_CATS.map(c => <option key={c}>{c}</option>)}</select>
                  <select value={ggMeal} onChange={e => setGgMeal(e.target.value)} style={{ ...SS, flex: 1 }}>{mealNames.map(mn => <option key={mn} value={mn === "(General)" ? "" : mn}>{mn}</option>)}</select>
                </div>
                <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={addGroc}>Add to List</button><button className="clnk" onClick={() => setAddGrocOpen(false)}>✕ Cancel</button></div>
              </div>
            )}
            {tileView && !drillCat && (() => {
              const icons = {"Vegetables":"🥦","Fruits":"🍎","Meat & Seafood":"🥩","Dairy":"🥛","Dry & Pantry":"🍝","Snacks & Drinks":"🥤","Other":"🛍️"};
              return <TileGrid onDrill={setDrillCat} groups={GROCERY_CATS.map(cat => { const items = filteredGroceries.filter(g=>g.category===cat); return { cat, color:catColors[cat], icon:icons[cat]||"🛍️", items, countLabel:"bought", doneCount:items.filter(x=>x.bought).length }; }).filter(g=>g.items.length>0)} />;
            })()}
            {(!tileView || drillCat) && GROCERY_CATS.map(cat => {
              if (drillCat && drillCat !== cat) return null;
              const items = filteredGroceries.filter(g => g.category === cat);
              if (!items.length) return null;
              const cc = catColors[cat];
              const collapsed = !drillCat && collapsedGroc[cat];
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <button onClick={() => toggleGrocGroup(cat)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "6px 2px", marginBottom: collapsed ? 0 : 6 }}>
                    <div style={{ width: 3, height: 14, background: cc, borderRadius: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: cc, textTransform: "uppercase", flex: 1, textAlign: "left" }}>{cat}</span>
                    <span style={{ fontSize: 10, color: "#b0a090" }}>({items.filter(x => x.bought).length}/{items.length})</span>
                    <span style={{ fontSize: 12, color: cc, marginLeft: 6 }}>{collapsed ? "▶" : "▼"}</span>
                  </button>
                  {!collapsed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {items.map(g => { const conf = g.confirmed || {}; const editing = grpId === g.id; return (
                        <div key={g.id}>
                          <div className="row" style={rowBase(editing, g.bought ? "1px solid #7ab87a" : undefined)}>
                            <button onClick={() => toggleBought(g.id, g.bought, g)} style={{ width: 20, height: 20, borderRadius: "50%", border: g.bought ? "none" : `2px solid ${cc}60`, background: g.bought ? cc : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                              {g.bought && <span style={{ fontSize: 10, color: "#fff", fontWeight: 900 }}>✓</span>}
                            </button>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: g.bought ? "#a09080" : "#2d2a24", textDecoration: g.bought ? "line-through" : "none" }}>{g.item}</span>
                              {g.qty && <span style={{ fontSize: 11, color: "#9a8a7a", marginLeft: 6 }}>{g.qty}</span>}
                              {g.forMeal && <div style={{ fontSize: 10, color: "#b0a090", marginTop: 1 }}>for: {g.forMeal}</div>}
                            </div>
                            <FamilyChecksWithEdit confirmed={conf} onToggle={m => toggleGrocConfirm(g.id, m, conf[m])} onEdit={m => openFamilyEdit(g.id, m, g)} />
                            <IBtn emoji="🗑" title="Delete" onClick={() => delGroc(g.id)} />
                          </div>
                          {editing && <EditDrawer>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input value={gr.item} onChange={e => setGr(v => ({ ...v, item: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveGroc(g.id)} style={{ ...IS, flex: 2 }} autoFocus />
                              <input value={gr.qty} onChange={e => setGr(v => ({ ...v, qty: e.target.value }))} placeholder="Qty" style={{ ...IS, flex: 1 }} />
                              <input value={gr.price || ""} onChange={e => setGr(v => ({ ...v, price: parseFloat(e.target.value)||0 }))} placeholder="A$" type="number" min="0" step="0.50" style={{ ...IS, flex: 1 }} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <select value={gr.category} onChange={e => setGr(v => ({ ...v, category: e.target.value }))} style={{ ...SS, flex: 1 }}>{GROCERY_CATS.map(c => <option key={c}>{c}</option>)}</select>
                              <select value={gr.forMeal || ""} onChange={e => setGr(v => ({ ...v, forMeal: e.target.value }))} style={{ ...SS, flex: 1 }}>{mealNames.map(mn => <option key={mn} value={mn === "(General)" ? "" : mn}>{mn}</option>)}</select>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={() => saveGroc(g.id)}>Save</button><button className="clnk" onClick={() => setGrpId(null)}>✕ Cancel</button></div>
                          </EditDrawer>}
                        </div>
                      ); })}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredGroceries.length === 0 && <div style={{ background: "#fff", border: "1px dashed #d4c9b8", borderRadius: 11, padding: "20px", color: "#b0a090", fontSize: 13, textAlign: "center" }}>Nothing here — tap + Add!</div>}
            <p style={{ marginTop: 8, fontSize: 11, color: "#b0a090", textAlign: "center" }}>Circle = bought · Tap coloured boxes to volunteer · ✏️ edit · 🗑 delete</p>
          </div>
        )}


        {/* PURCHASE POPUP */}
        {purchasePopup && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
            <div style={{ background:"#fff", borderRadius:18, padding:"24px", width:"100%", maxWidth:340, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
              {purchasePopup?.member ? <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6, color:memberColors[purchasePopup.member] }}>✏️ {purchasePopup.member}'s spend</div> : <div style={{ fontSize:11, color:"#9a8a7a", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>🛒 Marking as bought</div>}
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#2d2a24", marginBottom:4 }}>{purchasePopup.item}</div>
              {purchasePopup.plannedPrice > 0 && <div style={{ fontSize:12, color:"#9a8a7a", marginBottom:16 }}>Planned: A${parseFloat(purchasePopup.plannedPrice).toFixed(2)}</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#6a6058", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Actual Qty / Description</label>
                  <input value={actualQty} onChange={e => setActualQty(e.target.value)} placeholder="e.g. 1.2 kg" style={{ background:"#fff", border:"1px solid #d4c9b8", borderRadius:8, padding:"9px 12px", color:"#2d2a24", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%" }} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#6a6058", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Actual Amount Paid (A$)</label>
                  <input value={actualPrice} onChange={e => setActualPrice(e.target.value)} placeholder="e.g. 12.50" type="number" min="0" step="0.50" style={{ background:"#fff", border:"1px solid #d4c9b8", borderRadius:8, padding:"9px 12px", color:"#2d2a24", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%" }} autoFocus />
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={confirmPurchase} style={{ flex:1, background:"#3a7a4a", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✓ Confirm</button>
                <button onClick={skipPurchase} style={{ flex:1, background:"#f0ece4", color:"#6a6058", border:"1px solid #d4c9b8", borderRadius:10, padding:"12px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Skip</button>
              </div>
              <button onClick={() => setPurchasePopup(null)} style={{ width:"100%", background:"transparent", border:"none", color:"#b0a090", fontSize:12, cursor:"pointer", marginTop:10, fontFamily:"'DM Sans',sans-serif" }}>✕ Cancel</button>
            </div>
          </div>
        )}

        {/* ACTIVITIES */}
        {!loading && tab === "Activities" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>Activities 🥾</span>
              <button className="abtn" onClick={() => { setAddActOpen(v => !v); setEaId(null); }}>+ Suggest</button>
            </div>
            {addActOpen && (
              <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderRadius: 12, padding: "16px", marginBottom: 8, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 11, color: memberColors[who], fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}><Avatar name={who} size={16} /> {who}'s suggestion</div>
                <input value={naName} onChange={e => setNaName(e.target.value)} onKeyDown={e => e.key === "Enter" && addAct()} placeholder="e.g. Canoe around the lake…" style={IS} autoFocus />
                <select value={naDay} onChange={e => setNaDay(e.target.value)} style={{ ...SS, width: "100%" }}>{DAYS.map(d => <option key={d}>{d}</option>)}</select>
                <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={addAct}>Suggest</button><button className="clnk" onClick={() => setAddActOpen(false)}>✕ Cancel</button></div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[...acts].sort((a, b) => b.votes - a.votes).map(a => { const hv = (a.votedBy || []).includes(who); const editing = eaId === a.id; return (
                <div key={a.id}>
                  <div className="row" style={rowBase(editing)}>
                    <button onClick={() => toggleVote(a.id, a.votedBy, a.votes)} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: hv ? "#e2f2e9" : "#f5f5f0", border: hv ? "1.5px solid #7ab87a" : "1.5px solid #d4c9b8", borderRadius: 9, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: hv ? "#2e7d4f" : "#9a8a7a" }}>{hv ? "▲" : "△"}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: hv ? "#2e7d4f" : "#6a6058" }}>{a.votes}</span>
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{a.name}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge label={a.day} color="#3a65a8" />
                        <span style={{ fontSize: 10, color: "#9a8a7a" }}>by</span>
                        <Avatar name={a.suggestedBy} size={16} />
                        {(a.votedBy || []).length > 0 && <div style={{ display: "flex", gap: 2 }}>{(a.votedBy || []).map(v => <Avatar key={v} name={v} size={14} />)}</div>}
                      </div>
                    </div>
                    <IBtn emoji="✏️" title="Edit" onClick={() => editing ? setEaId(null) : (setEa({ name: a.name, day: a.day }), setEaId(a.id), setAddActOpen(false))} />
                    <IBtn emoji="🗑" title="Delete" onClick={() => delAct(a.id)} />
                  </div>
                  {editing && <EditDrawer>
                    <input value={ea.name} onChange={e => setEa(v => ({ ...v, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveAct(a.id)} style={IS} autoFocus />
                    <select value={ea.day} onChange={e => setEa(v => ({ ...v, day: e.target.value }))} style={{ ...SS, width: "100%" }}>{DAYS.map(d => <option key={d}>{d}</option>)}</select>
                    <div style={{ display: "flex", gap: 8 }}><button className="sbtn" onClick={() => saveAct(a.id)}>Save</button><button className="clnk" onClick={() => setEaId(null)}>✕ Cancel</button></div>
                  </EditDrawer>}
                </div>
              ); })}
            </div>
            <p style={{ marginTop: 10, fontSize: 11, color: "#b0a090", textAlign: "center" }}>△/▲ to vote · ✏️ edit · 🗑 delete</p>
          </div>
        )}
      </div>
    </div>
  );
}
