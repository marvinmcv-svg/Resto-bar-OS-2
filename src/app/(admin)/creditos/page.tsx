import { Panel } from "@/components/app/panel";

const CREDITS = [
  {"file": "majadito.jpg", "title": "Majadito o majau.jpg", "url": "https://commons.wikimedia.org/wiki/File:Majadito_o_majau.jpg", "author": "Ever Lecoña Hilari", "license": "CC BY-SA 4.0"},
  {"file": "pique-macho.jpg", "title": "Disfruta un buen Pique Macho.jpg", "url": "https://commons.wikimedia.org/wiki/File:Disfruta_un_buen_Pique_Macho.jpg", "author": "Jocelyn Abigail Vera", "license": "CC BY-SA 4.0"},
  {"file": "silpancho.jpg", "title": "Silpancho cochabambino.jpg", "url": "https://commons.wikimedia.org/wiki/File:Silpancho_cochabambino.jpg", "author": "Ever Lecoña Hilari", "license": "CC BY-SA 4.0"},
  {"file": "sopa-de-mani.jpg", "title": "Sopa de maní cochabambino, Bolivia.jpg", "url": "https://commons.wikimedia.org/wiki/File:Sopa_de_man%C3%AD_cochabambino,_Bolivia.jpg", "author": "Isaacromanfl", "license": "CC BY-SA 4.0"},
  {"file": "hamburguesa.jpg", "title": "Cheeseburger on Plate.jpg", "url": "https://commons.wikimedia.org/wiki/File:Cheeseburger_on_Plate.jpg", "author": "Ceeseven", "license": "CC BY-SA 4.0"},
  {"file": "cerveza.jpg", "title": "Glass of beer at All Star Sports Bar & Grill in September 2022.jpg", "url": "https://commons.wikimedia.org/wiki/File:Glass_of_beer_at_All_Star_Sports_Bar_%26_Grill_in_September_2022.jpg", "author": "JIP", "license": "CC BY-SA 4.0"},
  {"file": "chuflay.jpg", "title": "Chuflay, © Christian Eugenio.jpg", "url": "https://commons.wikimedia.org/wiki/File:Chuflay,_%C2%A9_Christian_Eugenio.jpg", "author": "Christian Eugenio", "license": "CC BY-SA 4.0"},
  {"file": "mojito.jpg", "title": "Fresh Mojito Premium.jpg", "url": "https://commons.wikimedia.org/wiki/File:Fresh_Mojito_Premium.jpg", "author": "Rjcastillo", "license": "CC BY-SA 4.0"},
  {"file": "limonada-frozen.jpg", "title": "Mojito Cocktail.jpg", "url": "https://commons.wikimedia.org/wiki/File:Mojito_Cocktail.jpg", "author": "Sunny windy soundy", "license": "CC BY-SA 4.0"},
  {"file": "jugo-maracuya.jpg", "title": "2020-06-23 19 31 14 A glass of Welch's Passion Fruit Juice in the Franklin Farm section of Oak Hill, Fairfax County, Virginia.jpg", "url": "https://commons.wikimedia.org/wiki/File:2020-06-23_19_31_14_A_glass_of_Welch%27s_Passion_Fruit_Juice_in_the_Franklin_Farm_section_of_Oak_Hill,_Fairfax_County,_Virginia.jpg", "author": "Famartin", "license": "CC BY-SA 4.0"},
  {"file": "cheesecake.jpg", "title": "Raised slice of cheesecake.jpg", "url": "https://commons.wikimedia.org/wiki/File:Raised_slice_of_cheesecake.jpg", "author": "Sirabellas", "license": "CC BY-SA 4.0"},
  {"file": "alitas.jpg", "title": "Chicken wings as a night snack.jpg", "url": "https://commons.wikimedia.org/wiki/File:Chicken_wings_as_a_night_snack.jpg", "author": "JIP", "license": "CC BY-SA 4.0"},
  {"file": "tequenos.jpg", "title": "Tequeños Venezolanos.jpg", "url": "https://commons.wikimedia.org/wiki/File:Teque%C3%B1os_Venezolanos.jpg", "author": "Rodolfo pimentel", "license": "CC BY-SA 4.0"},
];

export default function CreditosPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <h1 className="text-[28px] font-semibold">Créditos de fotos</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Las fotos del menú de demostración vienen de Wikimedia Commons, recortadas en cuadrado. En producción, cada restaurante sube
        las suyas.
      </p>
      <Panel className="mt-6">
        <ul className="space-y-3 text-[13px]">
          {CREDITS.map((c) => (
            <li key={c.file}>
              <a href={c.url} target="_blank" rel="noreferrer" className="font-medium underline-offset-2 hover:underline">
                {c.title}
              </a>
              <span className="text-muted-foreground">
                {" "}
                · {c.author} · {c.license}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
