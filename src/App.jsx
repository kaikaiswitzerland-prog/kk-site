import React from "react";
import menu from "./data/menu.json";

const entrees = menu.filter(i => i.category === "entrée");
const platsChaud = menu.filter(i => i.category === "plat_chaud");
const platsFroid = menu.filter(i => i.category === "plat_froid");
const boissons = menu.filter(i => i.category === "boisson");
const desserts = menu.filter(i => i.category === "dessert");

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Notre Carte</h1>

      <h2>🥗 Entrées</h2>
      {entrees.map(i => (
        <p key={i.id}><b>{i.name}</b> — {i.price} CHF<br />{i.desc}</p>
      ))}

      <h2>🔥 Plats Chauds</h2>
      {platsChaud.map(i => (
        <p key={i.id}><b>{i.name}</b> — {i.price} CHF<br />{i.desc}</p>
      ))}

      <h2>❄️ Plats Froids</h2>
      {platsFroid.map(i => (
        <p key={i.id}><b>{i.name}</b> — {i.price} CHF<br />{i.desc}</p>
      ))}

      <h2>🥤 Boissons</h2>
      {boissons.map(i => (
        <p key={i.id}><b>{i.name}</b> — {i.price} CHF<br />{i.desc}</p>
      ))}

      <h2>🍰 Desserts</h2>
      {desserts.map(i => (
        <p key={i.id}><b>{i.name}</b> — {i.price} CHF<br />{i.desc}</p>
      ))}
    </div>
  );
}

export default App;
