export const COACH_LINE_LIBRARY = {
  "version": "coach-lines-v127",
  "description": "Bibliothèque déterministe de punchlines InkSight enrichie avec références sportives, Disney/Pixar, pop culture, TCG et eSport.",
  "rules": {
    "titleMaxChars": 46,
    "descriptionMaxChars": 185,
    "defaultMode": "local-first",
    "availableVariables": [
      "monScore",
      "scoreAdverse",
      "scoreGap",
      "nbTours",
      "pace",
      "otp",
      "opponentName",
      "deckName",
      "matchupLabel",
      "topQuester",
      "topLoreSource",
      "topInkedCard",
      "topInkedCount",
      "topPlayedCard",
      "topPlayedCount",
      "inkFloat",
      "toursTopDeck",
      "nbMulligan",
      "loreFromLocations",
      "maxFloatTurn",
      "maxFloatAmount",
      "questRatio",
      "questCount",
      "challengeCount",
      "cardsPlayedTotal",
      "inkedTotal"
    ],
    "forbiddenTargets": [
      "identité du joueur",
      "apparence",
      "origine",
      "handicap",
      "insulte directe"
    ],
    "forbiddenWords": [
      "félicitations",
      "cependant",
      "bien joué",
      "analyse approfondie",
      "en conclusion"
    ]
  },
  "scenarios": [
    {
      "id": "perfect_win",
      "label": "Victoire parfaite",
      "priority": 100,
      "conditions": {
        "isWin": true,
        "scoreAdverseEquals": 0,
        "monScoreMin": 20
      },
      "tags": [
        "win",
        "stomp",
        "tempo"
      ],
      "lines": [
        {
          "id": "perfect_win_001",
          "title": "CLIMATISATION TOTALE",
          "description": "{opponentName} a fini à zéro. Tu as confisqué le board, la clock et le tempo sans même transpirer.",
          "tone": "hype",
          "intensity": 3
        },
        {
          "id": "perfect_win_002",
          "title": "FERMETURE DE LA BOUTIQUE",
          "description": "Un {monScore}-0 sec. {topQuester} a pointé la sortie et {opponentName} a juste visité le stade.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "perfect_win_003",
          "title": "MASTERCLASS CLINIQUE",
          "description": "Card Advantage, Ink Advantage, Lore Advantage : les trois compteurs étaient à toi. Rien n'a dépassé.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_win_004",
          "title": "ZÉRO LORE, ZÉRO DÉBAT",
          "description": "Le tableau d'affichage dit tout : {scoreAdverse} en face. C'est moins une game qu'une démonstration.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_win_005",
          "title": "RIDEAU BAISSÉ",
          "description": "Tu as verrouillé la partie avant le vrai late game. {opponentName} n'a jamais trouvé la porte d'entrée.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_win_006",
          "title": "LEÇON SANS APPEL",
          "description": "{topQuester} a converti le plan pendant que l'adversaire cherchait encore une ligne de jeu.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_win_007",
          "title": "TERRAIN INTERDIT",
          "description": "Pas un point concédé. Ton board était une zone de travaux, accès refusé pour {opponentName}.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_win_008",
          "title": "SCORE FANTÔME",
          "description": "{opponentName} termine à zéro lore : même le top deck n'a pas osé se présenter.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_win_009",
          "title": "PROPRETÉ CHIRURGICALE",
          "description": "Une victoire parfaite en {nbTours} tours. Pas de bavure, pas de panique, pas d'ouverture.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "perfect_win_010",
          "title": "CONTRÔLE PARENTAL",
          "description": "Tu as mis la game sous surveillance totale. {opponentName} n'a jamais eu l'autorisation de marquer.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_win_011",
          "title": "TABLE RASE",
          "description": "Le plan {pace} a déroulé sans résistance. {topQuester} a fait le ménage puis signé le score.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_win_012",
          "title": "BALAYAGE COMPLET",
          "description": "Un 20-0 qui ne laisse pas de note de bas de page. Le replay peut servir de tutoriel.",
          "tone": "hype",
          "intensity": 3
        },
        {
          "id": "perfect_win_013",
          "title": "MATCH CONFISQUÉ",
          "description": "Tu as pris les ressources, le board et la fin de partie. {opponentName} a joué depuis le parking.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "perfect_win_014",
          "title": "LE MUR NOIR",
          "description": "Impossible de passer. Ton tempo a fermé toutes les fenêtres avant que l'adversaire voie la lumière.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_win_015",
          "title": "AUCUNE RESPIRATION",
          "description": "Chaque tour a ajouté de la pression. À zéro lore, {opponentName} n'a pas eu le temps de respirer.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_win_016",
          "title": "DÉMO EN PUBLIC",
          "description": "La courbe, le mulligan et le lethal étaient alignés. Pas une game, une présentation PowerPoint.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "perfect_win_017",
          "title": "GAME SOUS SCELLÉS",
          "description": "Tu as mis le match dans un coffre dès l'ouverture. L'adversaire n'a jamais trouvé la combinaison.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_win_018",
          "title": "PAS DE TÉMOINS",
          "description": "{monScore}-{scoreAdverse}. Même les stats ont l'air gênées pour {opponentName}.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_win_019",
          "title": "CONTRAT REMPLI",
          "description": "Plan simple : accélérer, contrôler, finir. Exécution parfaite, opposition inexistante.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "perfect_win_020",
          "title": "STADE CLIMATISÉ",
          "description": "Le public a eu froid, {opponentName} aussi. Zéro lore, zéro menace, zéro suspense.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "perfect_win_021",
          "title": "MOURIR TRANQUILLE",
          "description": "Après ce {monScore}-{scoreAdverse}, même Thierry aurait rangé le micro. Board, tempo, lore : tout était sous clé.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_022",
          "title": "PAS DE PHOTO",
          "description": "{opponentName} n'a pas marqué un lore. La feuille de match ressemble à une démonstration privée.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_023",
          "title": "LONGUE VIE AU ROI",
          "description": "{topQuester} a pris le trône, et {opponentName} a juste regardé la couronne tomber.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_024",
          "title": "HAKUNA MATATA",
          "description": "Zéro stress, zéro lore concédé. Tu as joué la game comme si l'adversaire était en mode tutoriel.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_025",
          "title": "VERS L'INFINI",
          "description": "Ton score est parti très loin, celui de {opponentName} est resté au quai. Ramp ou non, c'était spatial.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_026",
          "title": "CLINIQUE ET CHIRURGICAL",
          "description": "Chaque tour avait son ordonnance. {topQuester} a signé le diagnostic, l'adversaire a signé la sortie.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_027",
          "title": "ROI DU MONDE",
          "description": "Tu as joué debout sur le pont pendant que {opponentName} coulait sans ouvrir le compteur.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_028",
          "title": "BIBBIDI BOBBIDI BOOM",
          "description": "La magie a opéré vite. {opponentName} a disparu du match avant même de comprendre la transformation.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_029",
          "title": "CE RÊVE BLEU",
          "description": "La partie avait des couleurs de conte. En face, aucun lore, aucune fenêtre, aucun tapis volant.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_030",
          "title": "ON PEUT MOURIR TRANQUILLE",
          "description": "Un clean sheet pareil, c'est du patrimoine. Même le board adverse demande une plaque commémorative.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_031",
          "title": "LE STADE N'EN REVIENT PAS",
          "description": "{opponentName} a fini muet. Tu as transformé chaque ressource en avance, puis en humiliation statistique.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_032",
          "title": "TOUT ÉTAIT ÉCRIT",
          "description": "La game a suivi ton script du mulligan au lethal. {topQuester} avait le rôle principal.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_033",
          "title": "INTÉRIEUR NUIT, ADVERSAIRE KO",
          "description": "Ce n'était pas un match, c'était une scène coupée. {opponentName} n'a jamais obtenu son dialogue.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_034",
          "title": "PAS TOUCHE AU TEMPO",
          "description": "Tu as gardé le rythme de l'empereur. {opponentName} n'a jamais posé la main sur la partie.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_035",
          "title": "AUCUN DÉBAT",
          "description": "Les chiffres sont secs : {monScore}-{scoreAdverse}. La courbe a parlé plus fort que le chat.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_036",
          "title": "FERMETURE ADMINISTRATIVE",
          "description": "Le board était conforme, l'adversaire non. Inspection terminée, {topQuester} garde les clés.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_037",
          "title": "SCÉNARIO DE LÉGENDE",
          "description": "Score vierge en face, tempo parfait chez toi. Ce replay mérite sa musique de générique.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_038",
          "title": "MATCH SANS OXYGÈNE",
          "description": "{opponentName} n'a jamais respiré. Tu as aspiré le card advantage, puis le reste de la pièce.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_039",
          "title": "TOUT POUR LE ROI",
          "description": "{topQuester} a questé comme héritier officiel. {opponentName} a découvert la monarchie absolue.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_win_040",
          "title": "LA TOTALE",
          "description": "Card Advantage, Ink Advantage, Lore Advantage : la triple couronne. Rien n'a échappé au contrôle.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "stomp_win",
      "label": "Victoire écrasante",
      "priority": 92,
      "conditions": {
        "isWin": true,
        "scoreAdverseMax": 7
      },
      "tags": [
        "win",
        "tempo",
        "stomp"
      ],
      "lines": [
        {
          "id": "stomp_win_001",
          "title": "ROULEAU COMPRESSEUR",
          "description": "{topQuester} a porté l'équipe pendant que {opponentName} cherchait encore sa curve.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "stomp_win_002",
          "title": "CASSAGE DE REINS",
          "description": "Victoire {monScore}-{scoreAdverse}. Le tempo a frappé fort et le board adverse a plié net.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "stomp_win_003",
          "title": "PROMENADE DE SANTÉ",
          "description": "Tu as déroulé en {nbTours} tours. {opponentName} a couru derrière le score sans jamais recoller.",
          "tone": "hype",
          "intensity": 2
        },
        {
          "id": "stomp_win_004",
          "title": "NO MATCH",
          "description": "L'écart parle tout seul. Tu as transformé chaque ressource en pression, lui en retard tactique.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_win_005",
          "title": "PRESSION MAXIMALE",
          "description": "{topQuester} a mis la clock au rouge. L'adversaire a subi plus qu'il n'a joué.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_win_006",
          "title": "SCOOP MENTAL",
          "description": "Même sans abandon officiel, le match était déjà plié. {opponentName} a pris le mur de face.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "stomp_win_007",
          "title": "TEMPO AU MARTEAU",
          "description": "Chaque tour a tapé plus fort que le précédent. La partie s'est refermée avant le confort adverse.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_win_008",
          "title": "BOUCHERIE TACTIQUE",
          "description": "Tu as gagné la course et le board. Difficile de demander mieux à un plan {pace}.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_win_009",
          "title": "IL A PRIS TARIF",
          "description": "{scoreAdverse} lore seulement en face. Pas un mauvais jour : un passage au laminoir.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "stomp_win_010",
          "title": "SORTIE PREMIUM",
          "description": "Le mulligan à {nbMulligan} carte(s) a trouvé le bon rythme. Derrière, tout a glissé.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "stomp_win_011",
          "title": "LEÇON DE CURVE",
          "description": "Tu as curvé propre, dépensé utile et converti vite. {opponentName} a vu le tableau s'éloigner.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_win_012",
          "title": "STADE ÉTEINT",
          "description": "À ce score, même les tribunes adverses ont arrêté d'y croire au tour {nbTours}.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "stomp_win_013",
          "title": "PLAN DÉROULÉ",
          "description": "Le deck a récité sa partition : encre, pression, lore. {opponentName} n'a jamais cassé le tempo.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "stomp_win_014",
          "title": "LIGNE DROITE",
          "description": "Tu n'as pas surjoué. Tu as juste accéléré vers les {monScore} et laissé l'autre dans le rétro.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_win_015",
          "title": "TAPIS ROUGE",
          "description": "Le board t'a ouvert la route. {topQuester} a simplement marché jusqu'au lethal.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_win_016",
          "title": "DÉFENSE ABSENTE",
          "description": "{opponentName} n'a pas trouvé les réponses. Ton moteur de lore a fait chantier ouvert.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "stomp_win_017",
          "title": "ÉCART DE CLASSE",
          "description": "Le score {monScore}-{scoreAdverse} résume la game : toi avec un plan, lui avec des espoirs.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "stomp_win_018",
          "title": "DOMINANCE NETTE",
          "description": "Tu as gagné les petits échanges puis la grande course. C'est propre, violent et efficace.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_win_019",
          "title": "BOARD SOUS CONTRÔLE",
          "description": "Une fois le plateau installé, la partie n'avait plus de mystère. {topQuester} a fini le travail.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_win_020",
          "title": "CLIM DOUCE",
          "description": "Pas un massacre bruyant, juste une lente extinction adverse. Le score a fait le commentaire.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_win_021",
          "title": "ROULEAU COMPRESSEUR",
          "description": "Le match a traversé {opponentName} sans ralentir. {topQuester} a mis les warnings trop tard.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_022",
          "title": "IL N'Y A PAS EU PHOTO",
          "description": "Victoire {monScore}-{scoreAdverse}. Même la VAR aurait validé l'écart de tempo.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_023",
          "title": "LONGUE VIE AU ROI",
          "description": "{topQuester} a pris le trône tôt, et le royaume adverse a plié sans révolution.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_024",
          "title": "SECOND POTEAU",
          "description": "{topQuester} a surgi au bon moment. {opponentName} cherchait le ballon, toi tu avais déjà le lethal.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_025",
          "title": "BOOM BÉBÉ",
          "description": "La partie a explosé côté {opponentName}. Ton board a dansé, son tempo a quitté la salle.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_026",
          "title": "ÊTES-VOUS DIVERTIS",
          "description": "Le public oui, {opponentName} moins. Tu as transformé le match en arène à sens unique.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_027",
          "title": "C'EST CLINIQUE",
          "description": "Chaque ressource a trouvé sa cible. Le score {monScore}-{scoreAdverse} ne laisse pas beaucoup de place au débat.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_028",
          "title": "PROMENADE DE SANTÉ",
          "description": "{nbTours} tours, un rythme propre, et {opponentName} en visite guidée dans ton plan de jeu.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_029",
          "title": "KACHOW",
          "description": "Départ rapide, virage propre, arrivée sans trafic. {opponentName} a vu passer les phares.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_030",
          "title": "LE BREAK EST FAIT",
          "description": "L'avantage a été pris tôt et jamais rendu. {topQuester} a gardé la balle au pied.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_031",
          "title": "PAVARD DANS LE COIN",
          "description": "Le play décisif est arrivé sans prévenir. {opponentName} a juste entendu le stade crier.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_032",
          "title": "PAS DE CAPE",
          "description": "Pas besoin d'artifice. Ton plan était assez solide pour voler sans se prendre dans le décor.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_033",
          "title": "LA SANCTION IMMÉDIATE",
          "description": "Chaque erreur adverse a été convertie en lore. {opponentName} a payé cash, sans échéancier.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_034",
          "title": "TON BOARD A PARLÉ",
          "description": "Les cartes ont fait le discours. {opponentName} n'a répondu qu'avec du silence et du retard.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_035",
          "title": "TAPIS ROUGE",
          "description": "{topQuester} a déroulé la route jusqu'au lethal. {opponentName} marchait derrière avec les valises.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_036",
          "title": "LE FILM ÉTAIT COURT",
          "description": "Peu de suspense, beaucoup de dégâts. Le montage final tient en {nbTours} tours.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_037",
          "title": "MATCH DE PATRON",
          "description": "Tu as pris le bureau, la chaise et les clés. {opponentName} a signé le reçu.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_038",
          "title": "CAVIAR DE TEMPO",
          "description": "La sortie était servie sur plateau. {topQuester} n'avait plus qu'à pousser au fond.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_039",
          "title": "L'ADVERSAIRE A SCOOP MENTAL",
          "description": "Même sans abandon visible, le board racontait déjà une fin très pénible pour {opponentName}.",
          "tone": "esport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_win_040",
          "title": "SANS TREMBLER",
          "description": "Tu as conclu proprement. La victoire {monScore}-{scoreAdverse} a plus de maîtrise que de bruit.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "clean_win",
      "label": "Victoire propre",
      "priority": 65,
      "conditions": {
        "isWin": true
      },
      "tags": [
        "win",
        "default"
      ],
      "lines": [
        {
          "id": "clean_win_001",
          "title": "TRAVAIL DE PRO",
          "description": "Victoire {monScore}-{scoreAdverse}. Tu as gardé le rythme {pace} et converti proprement tes ressources.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_002",
          "title": "PLAN VALIDÉ",
          "description": "Le deck a fait ce qu'il devait faire. {topQuester} a donné la direction, le reste a suivi.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_003",
          "title": "VICTOIRE SOLIDE",
          "description": "Pas besoin de théâtre : tempo stable, lore régulier, fin de partie maîtrisée.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_004",
          "title": "NET ET SANS BAVURE",
          "description": "Tu as trouvé assez de pression pour forcer {opponentName} à jouer en réaction tout le match.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_005",
          "title": "BON TEMPO",
          "description": "La curve n'a pas trahi. Les ressources ont été converties sans fuite majeure vers le score final.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_006",
          "title": "CONTRAT REMPLI",
          "description": "Le plan n'était pas spectaculaire, mais il a été propre. Parfois, c'est ça qui gagne.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_007",
          "title": "LETHAL EN GESTION",
          "description": "Tu n'as pas couru partout : tu as préparé le lethal et fermé la porte au bon moment.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_008",
          "title": "LECTURE CORRECTE",
          "description": "{opponentName} a résisté, mais tes décisions ont gardé la partie dans ton couloir.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_009",
          "title": "RYTHME IMPOSÉ",
          "description": "Le score final récompense une game tenue. Pas de panique, pas de gros trou d'air.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_010",
          "title": "PARTIE SÉRIEUSE",
          "description": "Tu as gagné sans explosion, mais avec assez de value pour ne jamais perdre le fil.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_011",
          "title": "BOARD RENTABLE",
          "description": "Les cartes jouées ont produit du lore ou du temps. C'est exactement ce qu'on demande.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_012",
          "title": "AVANTAGE CONVERTI",
          "description": "Tu as pris de petits edges et tu les as transformés en victoire. Rien de gratuit pour {opponentName}.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_013",
          "title": "COURSE MAÎTRISÉE",
          "description": "La clock était sous contrôle. Tu n'as pas donné à l'adversaire le temps de respirer vraiment.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "clean_win_014",
          "title": "GAME PROPRE",
          "description": "{monScore}-{scoreAdverse}, c'est une victoire nette. Le replay dira surtout que le plan a tenu.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_015",
          "title": "PAS DE CADEAU",
          "description": "Tu as puni les fenêtres adverses sans offrir de retour gratuit. Simple et efficace.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_016",
          "title": "TEMPO RENTABLE",
          "description": "Les tours ont été assez pleins pour éviter la fuite d'encre et maintenir la pression.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_017",
          "title": "SCORE LOGIQUE",
          "description": "Le résultat suit la dynamique : tu as joué devant, l'adversaire a tenté de suivre.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "clean_win_018",
          "title": "VICTOIRE SANS TREMBLER",
          "description": "Quelques décisions serrées, mais le volant est resté dans tes mains jusqu'au bout.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "clean_win_019",
          "title": "MOTEUR STABLE",
          "description": "{topQuester} a fait tourner la machine. Pas de feu d'artifice, juste du rendement.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_020",
          "title": "GESTION PROPRE",
          "description": "La partie ne s'est pas gagnée sur un miracle. Elle s'est gagnée sur une bonne conversion des ressources.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "clean_win_021",
          "title": "PLAN RESPECTÉ",
          "description": "Le plan de jeu est passé à la lettre. Pas spectaculaire, juste propre et très difficile à contester.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_022",
          "title": "VICTOIRE AU MÉTIER",
          "description": "Tu as sorti le bleu de chauffe. {topQuester} a travaillé, le tempo a suivi.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_023",
          "title": "C'EST PROPRE",
          "description": "Ressources converties, lore sécurisé, board sous contrôle. Une victoire qui sent la feuille de route validée.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_024",
          "title": "TOUT DROIT",
          "description": "Tu n'as pas cherché le cinéma. Une ligne claire, des quêtes efficaces, une win bien emballée.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_025",
          "title": "SANS BAVURE",
          "description": "Le score {monScore}-{scoreAdverse} raconte une partie maîtrisée, sans panique ni surjeu.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_026",
          "title": "IL N'A PAS TREMBLÉ",
          "description": "Le lethal est arrivé sans drame. Tu as joué les derniers tours avec la main froide.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_027",
          "title": "C'EST CHIRURGICAL",
          "description": "Pas une démonstration bruyante, mais une opération propre. {opponentName} a perdu ressource après ressource.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_028",
          "title": "HAKUNA CURVE",
          "description": "Pas de problème visible. La curve a chanté juste, et {topQuester} a gardé le rythme.",
          "tone": "disney_hint",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_029",
          "title": "BONNE SITUATION",
          "description": "Oui, c'est une bonne situation, ce board. Les ressources ont fait leur travail sans demander d'applaudissements.",
          "tone": "pop_fr",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_030",
          "title": "LE DOSSIER EST CLASSÉ",
          "description": "Début solide, milieu stable, fin sans trembler. Le match n'avait plus grand-chose à plaider.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_031",
          "title": "IL A FAIT LE BOULOT",
          "description": "{topQuester} n'a pas forcé le destin. Il a juste converti ce qu'il fallait, quand il fallait.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_032",
          "title": "C'EST UNE BELLE SOIRÉE",
          "description": "Victoire sérieuse, courbe stable, pression constante. Pas besoin de feu d'artifice pour gagner.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_033",
          "title": "LE RYTHME EST BON",
          "description": "Chaque tour a apporté sa pierre. {opponentName} n'a jamais trouvé assez de tempo pour revenir.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_034",
          "title": "PRESQUE ADMINISTRATIF",
          "description": "Tu as rempli le formulaire victoire : encre, board, lore, signature en bas de page.",
          "tone": "sarcastic",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_035",
          "title": "COMME UN HOMME",
          "description": "La ligne était disciplinée. Pas de panique, pas de détour, juste une exécution solide.",
          "tone": "disney_hint",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_036",
          "title": "BIEN CADRÉ",
          "description": "Les choix étaient propres. La victoire vient surtout d'une gestion sobre, pas d'un miracle.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_037",
          "title": "MATCH VERROUILLÉ",
          "description": "Tu as ouvert l'avance, puis fermé la porte. {opponentName} est resté dehors avec ses réponses.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_038",
          "title": "SIMPLE ET EFFICACE",
          "description": "Le deck a fait ce qu'il promettait. {topQuester} a mené, le reste a suivi.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_039",
          "title": "PAS DE MAUVAIS LEVIER",
          "description": "Chaque activation est partie dans le bon sens. Kronk peut garder son poste.",
          "tone": "disney_hint",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "clean_win_040",
          "title": "LA VALUE EN SILENCE",
          "description": "Pas de coup de tonnerre, juste une accumulation propre. La partie s'est gagnée par petits écarts.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "close_win",
      "label": "Victoire sur le fil",
      "priority": 88,
      "conditions": {
        "isWin": true,
        "scoreGapMax": 3,
        "monScoreMin": 18
      },
      "tags": [
        "win",
        "clutch"
      ],
      "lines": [
        {
          "id": "close_win_001",
          "title": "PHOTO-FINISH",
          "description": "Victoire {monScore}-{scoreAdverse}. Un trade mal placé et le trophée partait en face.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "close_win_002",
          "title": "CLUTCH MOMENT",
          "description": "La game s'est jouée au dernier virage. {topQuester} a trouvé le pixel de lethal qui manquait.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "close_win_003",
          "title": "CARDIAQUE",
          "description": "Tour {nbTours}, pression maximale. Tu as tenu le volant pendant que le score hurlait danger.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "close_win_004",
          "title": "SUR LE FIL",
          "description": "Tu gagnes, mais le replay a laissé des traces. La course au lore s'est jouée à rien.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_win_005",
          "title": "SPRINT FINAL",
          "description": "{opponentName} était dans le rétro. Tu as fermé la porte juste avant le dépassement.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "close_win_006",
          "title": "UN POIL DE LORE",
          "description": "Victoire minuscule, valeur énorme. C'est le genre de finish qui donne envie de revoir la VOD.",
          "tone": "hype",
          "intensity": 2
        },
        {
          "id": "close_win_007",
          "title": "MENTAL SOLIDE",
          "description": "La pression était réelle. Tu as évité la panique et trouvé le lethal avant l'autre.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_win_008",
          "title": "BRAQUAGE PROPRE",
          "description": "La game était ouverte, tu es parti avec la caisse. {scoreAdverse} lore en face, ça pique.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "close_win_009",
          "title": "SAUVÉ AU BUZZER",
          "description": "Le top deck n'a pas eu besoin de miracle : juste assez de tempo pour fermer le score.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_win_010",
          "title": "LETHAL ARRACHÉ",
          "description": "Tu as touché la ligne avant {opponentName}. Un tour de plus et le scénario changeait.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "close_win_011",
          "title": "ÇA PASSE JUSTE",
          "description": "Pas la victoire la plus confortable, mais les points sont là. Le stade respire enfin.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "close_win_012",
          "title": "FIN DE THRILLER",
          "description": "{nbTours} tours de tension et un finish à couteaux tirés. Tu as gardé le dernier mot.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_win_013",
          "title": "DERNIER SPRINT",
          "description": "La race au lore a fini en duel de nerfs. Tu as couru plus juste, pas forcément plus vite.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_win_014",
          "title": "HOLD-UP AUTORISÉ",
          "description": "Le score est serré, mais la win est légale. {opponentName} peut déposer réclamation au bureau des seums.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "close_win_015",
          "title": "LE FIL ROUGE",
          "description": "Tu n'as jamais lâché la ligne de victoire malgré une clock adverse très proche.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "close_win_016",
          "title": "DERNIÈRE CARTOUCHE",
          "description": "La partie a demandé chaque ressource disponible. Aucun gaspillage permis au finish.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_win_017",
          "title": "RESPIRATION COUPÉE",
          "description": "À {scoreAdverse} lore en face, chaque décision pesait une tonne. Tu as survécu.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_win_018",
          "title": "FINISH DE DARON",
          "description": "Pas joli à tous les tours, mais froid au moment de conclure. C'est ça qu'on retient.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_win_019",
          "title": "VICTOIRE TREMBLANTE",
          "description": "Le score dit serré, mais la ligne de fin dit victoire. On prend, on analyse après.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "close_win_020",
          "title": "TOP FINISHER",
          "description": "La marge était fine. {topQuester} a transformé une fenêtre minuscule en point final.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_win_021",
          "title": "SECOND POTEAU",
          "description": "{topQuester} a surgi au money time. {opponentName} avait le regard du défenseur battu.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_022",
          "title": "IL N'A PAS TREMBLÉ",
          "description": "Au moment de conclure, tu as gardé la main froide. Le lethal a trouvé le chemin.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_023",
          "title": "PHOTO-FINISH",
          "description": "Victoire {monScore}-{scoreAdverse}. Le replay mérite une ligne d'arrivée et trois ralentis.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_024",
          "title": "LA VIE TROUVE UN CHEMIN",
          "description": "Le match semblait fermé, puis une ligne de jeu a ouvert la porte au dernier moment.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_025",
          "title": "LE STADE A EXPLOSÉ",
          "description": "Dernier virage, dernier lore, dernier souffle. {opponentName} était à une carte de te climatiser.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_026",
          "title": "CLUTCH À LA PAVARD",
          "description": "Ce n'était pas le play attendu, mais c'était le bon. Le lethal est arrivé en pleine lucarne.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_027",
          "title": "PAS AUJOURD'HUI",
          "description": "{opponentName} a cru tenir la fin. Tu as refusé le scénario au dernier tour.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_028",
          "title": "BRAQUAGE PROPRE",
          "description": "Tu n'as pas volé la game, tu l'as prise avec panache. Nuance importante.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_029",
          "title": "LE TOP DECK SOURIT",
          "description": "La partie a tremblé, puis le deck a choisi son héros. {topQuester} valide le dernier acte.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_030",
          "title": "TOUT S'EST JOUÉ LÀ",
          "description": "Un tour, une décision, un lore. Le genre de fin qui fatigue plus qu'un BO3 complet.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_031",
          "title": "TENSION PALPABLE",
          "description": "La course au lore était irrespirable. Tu as trouvé la sortie avant que le plafond tombe.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_032",
          "title": "UN CHEVEU DE LORE",
          "description": "Victoire au millimètre. {opponentName} a presque touché la ligne, mais presque ne score pas.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_033",
          "title": "LE DERNIER MOT",
          "description": "La game a parlé longtemps. Tu as gardé la meilleure réplique pour la dernière scène.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_034",
          "title": "MOMENT GLADIATEUR",
          "description": "Êtes-vous divertis ? Parce que ce finish {monScore}-{scoreAdverse} a coûté quelques pulsations.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_035",
          "title": "NAGE DROIT DEVANT",
          "description": "Tu as tenu quand ça tanguait. La ligne droite au lore a fini par payer.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_036",
          "title": "LE HOLD-UP DU SOIR",
          "description": "Ce n'était pas gratuit, mais c'était cruel. {opponentName} a vu la lumière s'éteindre tard.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_037",
          "title": "LA FLEUR DANS L'ADVERSITÉ",
          "description": "Départ compliqué, fin magnifique. Le match a récompensé la patience et la lecture du tempo.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_038",
          "title": "ÇA L'EST MAINTENANT",
          "description": "Ils croyaient que c'était fini. Ton dernier tour a corrigé le panneau d'affichage.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_039",
          "title": "LE DESTIN EN MAIN",
          "description": "Tu as trouvé le bon play dans le bruit. La game a basculé sur une décision propre.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_win_040",
          "title": "CAVIAR AU BUZZER",
          "description": "Le dernier tour était servi parfaitement. {topQuester} n'avait plus qu'à finir l'action.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "concede_win",
      "label": "Victoire avant 20",
      "priority": 83,
      "conditions": {
        "isWin": true,
        "monScoreMax": 19
      },
      "tags": [
        "win",
        "scoop"
      ],
      "lines": [
        {
          "id": "concede_win_001",
          "title": "ABANDON DANS LA DOULEUR",
          "description": "Le score s'arrête à {monScore}-{scoreAdverse}, mais le message est clair : {opponentName} a senti le lethal arriver.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "concede_win_002",
          "title": "IL A JETÉ L'ÉPONGE",
          "description": "Pas besoin d'aller à 20. Le board racontait déjà la fin du film.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "concede_win_003",
          "title": "SCOOP DÉTECTÉ",
          "description": "Victoire avant la ligne. Quand l'adversaire quitte tôt, c'est souvent que la clock était déjà trop lourde.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "concede_win_004",
          "title": "FUITE ORGANISÉE",
          "description": "{opponentName} a préféré sortir avant le dernier coup. Respectable, mais le seum reste visible.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "concede_win_005",
          "title": "MATCH PLIÉ",
          "description": "Le score ne va pas à 20, mais la dynamique était verrouillée. Le lethal était dans la pièce.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "concede_win_006",
          "title": "FIN ANTICIPÉE",
          "description": "Tu avais assez de pression pour forcer la sortie. {topQuester} n'a même pas eu besoin de finir.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "concede_win_007",
          "title": "K.O. TECHNIQUE",
          "description": "La partie n'a pas attendu le score final. Le board a parlé plus fort que les lore.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "concede_win_008",
          "title": "SIGNE DE DÉTRESSE",
          "description": "Quand ça concède à {scoreAdverse}, c'est que le plan adverse avait déjà coulé.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "concede_win_009",
          "title": "RIDEAU AVANT L'HEURE",
          "description": "Le spectacle s'arrête tôt. Tu avais pris assez d'avance pour rendre la suite inutile.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "concede_win_010",
          "title": "CONCESSION PROPRE",
          "description": "{opponentName} a lu la table et compris le futur. Pas agréable, mais lucide.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "concede_win_011",
          "title": "PAS BESOIN DE 20",
          "description": "Tu n'as pas touché les 20, mais tu avais déjà gagné la position. Le score ment à moitié.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "concede_win_012",
          "title": "SORTIE DE SECOURS",
          "description": "L'adversaire a trouvé la seule ligne encore ouverte : le bouton abandon.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "concede_win_013",
          "title": "PRESSION FATALE",
          "description": "Le tempo était trop lourd. Même sans score final, la partie était sous contrôle.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "concede_win_014",
          "title": "GAME ÉCOURTÉE",
          "description": "Le plan {pace} a mis assez de poids pour faire plier le mental adverse.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "concede_win_015",
          "title": "ADVERSAIRE ÉVAPORÉ",
          "description": "{opponentName} a disparu avant le générique. Le replay garde quand même les preuves.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "concede_win_016",
          "title": "LA SUITE ÉTAIT ÉCRITE",
          "description": "La table annonçait déjà le lethal. L'adversaire a juste économisé quelques clics.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "concede_win_017",
          "title": "DRAPEAU BLANC",
          "description": "La pression au lore a fait tomber le drapeau avant les 20. Mission accomplie.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "concede_win_018",
          "title": "FIN PAR ABANDON",
          "description": "Tu as forcé la concession, ce qui vaut souvent plus qu'un finish long et sale.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "concede_win_019",
          "title": "SCOOP MENTAL CONFIRMÉ",
          "description": "Même si le score paraît modeste, la position disait game over.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "concede_win_020",
          "title": "SORTIE CÔTÉ COUR",
          "description": "{opponentName} a quitté la scène pendant que ton board prenait les applaudissements.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "concede_win_021",
          "title": "À VOUS LES STUDIOS",
          "description": "{opponentName} a quitté le plateau avant le générique. Le board annonçait déjà la météo du lethal.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_022",
          "title": "SCOOP TÉLÉVISÉ",
          "description": "Pas besoin d'aller au bout. Le match était déjà commenté, rejoué et classé.",
          "tone": "esport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_023",
          "title": "FIN DU PROGRAMME",
          "description": "Le score s'arrête à {monScore}-{scoreAdverse}, mais le tempo avait déjà rendu son verdict.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_024",
          "title": "RIDEAU BAISSÉ",
          "description": "{opponentName} a vu la fin arriver et a préféré couper avant la scène douloureuse.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_025",
          "title": "ABANDON STRATÉGIQUE",
          "description": "Quand le board commence à écrire le scénario tout seul, parfois le meilleur play reste le menu principal.",
          "tone": "esport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_026",
          "title": "IL A VU LE FILM",
          "description": "{opponentName} connaissait déjà la fin. {topQuester} avait pris trop de place à l'écran.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_027",
          "title": "CLIM ANTICIPÉE",
          "description": "La partie n'était pas finie, mais la température était déjà négative côté adverse.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_028",
          "title": "SORTIE DE SECOURS",
          "description": "{opponentName} a trouvé une porte avant que le lethal ne trouve son adresse.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_029",
          "title": "PAS LA PEINE",
          "description": "Le board parlait assez fort. Continuer aurait juste ajouté des témoins.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_030",
          "title": "LETHAL EN APPROCHE",
          "description": "{opponentName} a entendu les sirènes du dernier tour et a rangé les cartes.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_031",
          "title": "LE MATCH ÉTAIT PLIÉ",
          "description": "Le panneau n'affiche pas 20, mais la game avait déjà pris la direction du parking.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_032",
          "title": "TROP DE TEMPO",
          "description": "Ton avance a fait plus peur que le score. {opponentName} a respecté la menace.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_033",
          "title": "LE GÉNÉRIQUE ARRIVE",
          "description": "La scène finale se préparait. {opponentName} a quitté la salle avant les crédits.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_034",
          "title": "SCOOP SANS DÉBAT",
          "description": "Ce n'était pas une panique, c'était de la lucidité. Le board ne proposait plus d'issue.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_035",
          "title": "FERMETURE PRÉCOCE",
          "description": "La boutique n'était pas encore à 20, mais l'enseigne indiquait déjà complet.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_036",
          "title": "PAS DE PROLONGATION",
          "description": "{opponentName} a refusé le temps additionnel. Le match avait déjà son vainqueur.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_037",
          "title": "VICTOIRE PAR ÉVIDENCE",
          "description": "Parfois, les chiffres ne vont pas au bout parce que le board les devance.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_038",
          "title": "L'ADVERSAIRE A COMPRIS",
          "description": "Il a lu la table, vu le lethal, puis choisi la dignité statistique.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_039",
          "title": "SANS FINIR L'ASSIETTE",
          "description": "Tu avais déjà trop servi. {opponentName} a quitté le repas avant le dessert.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "concede_win_040",
          "title": "LE STADE SE VIDE",
          "description": "Le match n'était pas officiellement mort, mais tout le monde connaissait le score moral.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "passive_lore_win",
      "label": "Victoire par lore passif",
      "priority": 89,
      "conditions": {
        "isWin": true,
        "loreFromLocationsMin": 4
      },
      "tags": [
        "win",
        "locations",
        "passive_lore"
      ],
      "lines": [
        {
          "id": "passive_lore_win_001",
          "title": "RENTE IMMOBILIÈRE",
          "description": "{loreFromLocations} lore venus des lieux. Pendant que ça se battait sur le board, les loyers tombaient.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "passive_lore_win_002",
          "title": "MONOPOLY LORCANA",
          "description": "Tu as gagné au cadastre. {opponentName} a oublié les lieux et la facture est arrivée au start-of-turn.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "passive_lore_win_003",
          "title": "LORE PASSIF LÉTAL",
          "description": "Les lieux ont fait le sale boulot en silence. {loreFromLocations} points gratuits, c'est une rente.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_004",
          "title": "CASA FAIT CAISSE",
          "description": "Si Casa Madrigal était là, elle a encaissé. Le board criait, les lieux marquaient.",
          "tone": "disney_hint",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_005",
          "title": "INVESTISSEMENT LOCATIF",
          "description": "Tu as posé l'infrastructure et laissé tourner. {opponentName} a payé chaque tour d'inaction.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_006",
          "title": "LA PIERRE RAPPORTE",
          "description": "Le plan n'avait pas besoin de tout défier. Les lieux ont simplement transformé le temps en lore.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "passive_lore_win_007",
          "title": "START-OF-TOUR FATAL",
          "description": "Chaque début de tour ajoutait une pelletée de pression. {loreFromLocations} lore passif, c'est beaucoup trop.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_008",
          "title": "FORTERESSE RENTABLE",
          "description": "Tu as gagné depuis l'arrière-boutique. Les personnages occupaient, les lieux facturaient.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_009",
          "title": "LOYER IMPAYÉ",
          "description": "{opponentName} a laissé les lieux vivre. Résultat : {loreFromLocations} lore sans effort apparent.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "passive_lore_win_010",
          "title": "LE TERRAIN PARLE",
          "description": "La game s'est jouée sur l'espace. Tes lieux ont produit plus qu'une simple présence.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "passive_lore_win_011",
          "title": "BRIQUE PAR BRIQUE",
          "description": "Tu as construit la victoire sans t'exposer inutilement. Les lieux ont fait monter la clock.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "passive_lore_win_012",
          "title": "TOURISME PAYANT",
          "description": "L'adversaire a visité tes lieux sans les gérer. Il repart avec la note.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "passive_lore_win_013",
          "title": "PLAN IMMOBILIER",
          "description": "Pas besoin de courir partout quand le plateau marque pour toi au début du tour.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_014",
          "title": "LORE EN SILENCE",
          "description": "La menace n'était pas bruyante, mais elle a marqué {loreFromLocations}. C'est exactement le piège.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_015",
          "title": "RÉSIDENCE PRINCIPALE",
          "description": "Ton meilleur moteur n'était pas forcément un personnage. C'était une adresse à ne pas ignorer.",
          "tone": "disney_hint",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_016",
          "title": "RENTE NON CONTESTÉE",
          "description": "Laisser tourner tes lieux, c'était signer le bail de la défaite adverse.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "passive_lore_win_017",
          "title": "BOARD CONTOURNÉ",
          "description": "Tu as laissé l'adversaire se fatiguer dans les trades pendant que le score montait ailleurs.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_018",
          "title": "PASSIF DESTRUCTEUR",
          "description": "{loreFromLocations} lore sans attaque directe, c'est le genre de détail qui assassine une clock.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_019",
          "title": "PLAN DE PROPRIÉTAIRE",
          "description": "Tu n'as pas juste joué des cartes, tu as installé une économie. Et elle a payé.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "passive_lore_win_020",
          "title": "LE CADASTRE GAGNE",
          "description": "Quand les lieux marquent autant, le match devient une affaire de géographie plus que de baston.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "passive_lore_win_021",
          "title": "L'IMMOBILIER PAIE",
          "description": "{loreFromLocations} lore passif. Les lieux ont encaissé pendant que le board faisait diversion.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_022",
          "title": "CASA MADRIGAL FC",
          "description": "La victoire est venue du cadastre. {opponentName} a oublié de visiter les lieux.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_023",
          "title": "RENTE ROYALE",
          "description": "Longue vie au loyer. Tes lieux ont gagné sans même demander un challenge.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_024",
          "title": "LÀ-HAUT, ÇA SCORE",
          "description": "Les points tombaient d'en haut. {loreFromLocations} lore passif, et {opponentName} regardait le ciel.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_025",
          "title": "CADASTRE LÉTAL",
          "description": "Ce n'était pas un board, c'était une copropriété. Chaque start-of-turn ajoutait la facture.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_026",
          "title": "PROPRIÉTAIRE DU MATCH",
          "description": "Pendant que {opponentName} cherchait des trades, tes lieux signaient le bail de la victoire.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_027",
          "title": "RENDEMENT PASSIF",
          "description": "{loreFromLocations} lore sans forcer. Le deck a découvert les intérêts composés.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_028",
          "title": "LE MONOPOLY CONTINUE",
          "description": "Tu n'as pas acheté la rue, tu as acheté le match. {opponentName} a payé le loyer en retard.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_029",
          "title": "BOUTIQUE IMMOBILIÈRE",
          "description": "Le combat était ailleurs. Tes lieux ont tenu la caisse pendant que le board occupait le regard.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_030",
          "title": "VIE PROVINCIALE, NON",
          "description": "Les lieux voulaient beaucoup plus qu'une vie provinciale : ils voulaient tes {monScore} lore.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_031",
          "title": "START-OF-TURN FATAL",
          "description": "Chaque tour commençait avec une mauvaise nouvelle pour {opponentName}. {loreFromLocations} lore gratuits, ça pique.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_032",
          "title": "L'ADVERSAIRE A OUBLIÉ L'ADRESSE",
          "description": "Les lieux étaient là, visibles, rentables. {opponentName} a choisi de regarder ailleurs.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_033",
          "title": "CASA A FAIT LE CAFÉ",
          "description": "Le board s'agitait, mais les lieux ont fait le vrai travail de fond.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_034",
          "title": "LA RENTE DU LORE",
          "description": "Pas besoin de courir partout. Les lieux ont marqué pendant que les personnages jouaient les gardiens.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_035",
          "title": "CADASTRE CONTRE BOARD",
          "description": "Le board était bruyant, le cadastre était efficace. Devine lequel a gagné.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_036",
          "title": "LE LOYER TOMBE",
          "description": "À chaque tour, la facture arrivait. {opponentName} a sous-estimé le passif.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_037",
          "title": "CHANTIER RENTABLE",
          "description": "Tu as construit tôt, puis récolté tard. Belle gestion de l'espace et du tempo.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_038",
          "title": "PAS DE COMBAT, DU LOYER",
          "description": "La partie ne s'est pas gagnée au poing. Elle s'est gagnée à l'emplacement.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_039",
          "title": "WALLABY WAY CADASTRE",
          "description": "Plan compliqué ? Non, adresse claire : lieux actifs, lore passif, adversaire en retard.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "passive_lore_win_040",
          "title": "TERRAIN ACQUIS",
          "description": "{opponentName} a perdu le sol avant de perdre la partie. Les lieux avaient déjà planté le drapeau.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "aggro_win",
      "label": "Victoire rapide",
      "priority": 82,
      "conditions": {
        "isWin": true,
        "nbToursMax": 6
      },
      "tags": [
        "win",
        "aggro",
        "speed"
      ],
      "lines": [
        {
          "id": "aggro_win_001",
          "title": "ÉCLAIR AU DÉMARRAGE",
          "description": "{nbTours} tours seulement. Tu as appuyé sur l'accélérateur et {opponentName} a raté le départ.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "aggro_win_002",
          "title": "SPRINT LÉTAL",
          "description": "Pas de late game, pas de débat. Le plan a couru droit vers les {monScore} lore.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "aggro_win_003",
          "title": "AGGRO SOUS CAFÉINE",
          "description": "Le rythme était trop rapide. {opponentName} a voulu stabiliser, le match était déjà parti.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "aggro_win_004",
          "title": "DÉPART CANON",
          "description": "Tu as gagné la course avant que l'autre installe son moteur. C'est brutal mais légal.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "aggro_win_005",
          "title": "TROP VITE",
          "description": "{nbTours} tours, c'est court. Le replay ressemble à un avertissement pour les mains lentes.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "aggro_win_006",
          "title": "CLOCK EXPRESS",
          "description": "La pression au lore a commencé tôt et n'a jamais ralenti. L'adversaire a joué en retard permanent.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "aggro_win_007",
          "title": "TURBO LORE",
          "description": "Tu as converti vite, sans luxe inutile. Chaque tour demandait une réponse immédiate.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "aggro_win_008",
          "title": "OUVERTURE EXPLOSIVE",
          "description": "Le mulligan a trouvé assez de carburant. Derrière, la partie n'a pas dépassé la voie rapide.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "aggro_win_009",
          "title": "LIGNE DROITE PURE",
          "description": "Pas de détour par l'attrition : tu as choisi la course, et tu l'as gagnée.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "aggro_win_010",
          "title": "VITESSE SANCTION",
          "description": "Un adversaire trop lent face à ce départ, c'est carton rouge tactique.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "aggro_win_011",
          "title": "TOP CHRONO",
          "description": "Le compteur de tours n'a même pas eu le temps de s'échauffer. {topQuester} a fait le sprint.",
          "tone": "hype",
          "intensity": 2
        },
        {
          "id": "aggro_win_012",
          "title": "RUSH PROPRE",
          "description": "Rapide ne veut pas dire brouillon. Tu as gardé une ligne claire jusqu'au lethal.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "aggro_win_013",
          "title": "ACCÉLÉRATION VALIDÉE",
          "description": "Tu as transformé l'early en fin de match. C'est exactement ce qu'un plan rapide doit faire.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "aggro_win_014",
          "title": "LA FUSÉE",
          "description": "{opponentName} a cligné des yeux, tu étais déjà à portée de lethal.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "aggro_win_015",
          "title": "EARLY GAME VOLÉ",
          "description": "Tu as pris les premiers tours et jamais rendu les clés. La partie était déjà inclinée.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "aggro_win_016",
          "title": "DÉMARRAGE SEC",
          "description": "Peu de tours, peu d'erreurs, beaucoup de pression. La recette était simple.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "aggro_win_017",
          "title": "PAS DE PAUSE",
          "description": "Chaque tour demandait une réponse. {opponentName} n'a jamais eu le temps de respirer.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "aggro_win_018",
          "title": "COURBE TRANCHANTE",
          "description": "La curve a coupé net dans le plan adverse. Trop propre pour être rattrapé.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "aggro_win_019",
          "title": "LE FEU VERT",
          "description": "Dès l'ouverture, tu as joué devant. Une fois la clock lancée, impossible de revenir.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "aggro_win_020",
          "title": "FAST LANE",
          "description": "Le match a pris la voie rapide. {opponentName} est resté au péage.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "aggro_win_021",
          "title": "JE SUIS LA VITESSE",
          "description": "{nbTours} tours et déjà la ligne d'arrivée. {opponentName} n'a vu que la poussière.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_022",
          "title": "KACHOW",
          "description": "La game a démarré en trombe. Ton plan aggro n'a pas demandé la permission.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_023",
          "title": "SPEEDRUN HOMOLOGUÉ",
          "description": "{nbTours} tours, peu de questions, beaucoup de lore. Le chrono valide.",
          "tone": "esport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_024",
          "title": "DÉPART CANON",
          "description": "Tu as gagné la première foulée, puis toutes les autres. {opponentName} a raté le départ.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_025",
          "title": "PAS DE LATE GAME",
          "description": "Le late game est resté dans les vestiaires. La partie avait déjà pris fin.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_026",
          "title": "AGGRO ÉCLAIR",
          "description": "La pression est arrivée avant les réponses. {topQuester} a allumé les panneaux.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_027",
          "title": "TOUT DROIT AU BUT",
          "description": "Pas de détour, pas de poésie. Tu as pris l'axe central et frappé fort.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_028",
          "title": "LE BREAK D'ENTRÉE",
          "description": "Avantage pris trop tôt, reprise impossible. {opponentName} a couru derrière le bus.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_029",
          "title": "PAVARD AU TOUR {nbTours}",
          "description": "La frappe est partie tôt et propre. {opponentName} n'a pas eu le temps de cadrer.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_030",
          "title": "VERS L'INFINI",
          "description": "Le score a décollé avant que l'adversaire ne trouve la piste.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_031",
          "title": "TAPIS VOLANT EXPRESS",
          "description": "La game a survolé le board. {opponentName} est resté au sol.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_032",
          "title": "BOSS RUSH",
          "description": "Tu as enchaîné les tours comme un speedrun. Le dernier boss n'avait pas de phase deux.",
          "tone": "gaming",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_033",
          "title": "LE TEMPO EN FUSÉE",
          "description": "L'encre a suivi, le board aussi, le lore encore plus. Départ parfait.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_034",
          "title": "SANS FREIN",
          "description": "Quand le deck part comme ça, le bouton pause devrait être interdit.",
          "tone": "gaming",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_035",
          "title": "OURAGAN DE LORE",
          "description": "La pression a tout emporté. {opponentName} cherchait un parapluie, pas une réponse.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_036",
          "title": "LA COURSE EST FINIE",
          "description": "Tu as sprinté vers {monScore}. En face, la défense était encore au rond central.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_037",
          "title": "DANS LE RÉTRO",
          "description": "{opponentName} n'a jamais été devant. Tu as joué toute la game avec les feux verts.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_038",
          "title": "LE TEMPO A KLAXONNÉ",
          "description": "La curve était prioritaire. Tout le monde s'est écarté, même le board adverse.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_039",
          "title": "TROP VITE, TROP FORT",
          "description": "Le match n'a pas respiré. Ton deck a transformé chaque tour en accélération.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "aggro_win_040",
          "title": "FIN AVANT L'ENTRACTE",
          "description": "Le scénario n'a pas atteint le deuxième acte. La win était déjà assise au premier rang.",
          "tone": "cinematic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "control_win",
      "label": "Victoire longue / contrôle",
      "priority": 72,
      "conditions": {
        "isWin": true,
        "nbToursMin": 13
      },
      "tags": [
        "win",
        "control",
        "attrition"
      ],
      "lines": [
        {
          "id": "control_win_001",
          "title": "GUERRE D'USURE",
          "description": "{nbTours} tours, beaucoup de nerfs. Tu as gagné à la patience et à la gestion des ressources.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_win_002",
          "title": "DANS LES TRANCHÉES",
          "description": "Un match long, sale et mental. Le genre de victoire qui se construit carte après carte.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_win_003",
          "title": "CONTRÔLE TOTAL",
          "description": "Tu as laissé la partie durer, mais jamais vraiment t'échapper. C'est du contrôle assumé.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_004",
          "title": "MARATHON MENTAL",
          "description": "{nbTours} tours, ça use. Tu as gardé assez de lucidité pour fermer au bon moment.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_win_005",
          "title": "LATE GAME VALIDÉ",
          "description": "Le plan a survécu jusqu'au moment où tes grosses ressources valaient plus que les siennes.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_006",
          "title": "ATTRITION GAGNÉE",
          "description": "Chaque trade a grignoté l'adversaire. À la fin, il n'avait plus assez de réponses.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_win_007",
          "title": "PATIENCE RENTABLE",
          "description": "Tu n'as pas forcé le lethal. Tu l'as laissé devenir inévitable.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_008",
          "title": "ÉCHECS EN CARTON",
          "description": "Ce n'était pas rapide, mais c'était précis. {opponentName} a perdu pièce après pièce.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_win_009",
          "title": "LONG FORMAT",
          "description": "La partie a duré, mais ton plan avait prévu le supplément. C'est ça, le contrôle.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_010",
          "title": "GESTION FROIDE",
          "description": "Tu as encaissé les vagues sans paniquer. Le late game a fini par payer.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_011",
          "title": "USURE CONTRÔLÉE",
          "description": "{topQuester} n'a peut-être pas hurlé, mais il a converti assez pour fermer la série.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_012",
          "title": "SLOW COOK",
          "description": "Tu as mijoté la partie jusqu'à ce que {opponentName} soit à court d'oxygène.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "control_win_013",
          "title": "BOARD ÉPUISÉ",
          "description": "Le plateau a mangé des ressources pendant {nbTours} tours. Tu as été le dernier debout.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_win_014",
          "title": "FIN DE MARATHON",
          "description": "Ça finit en victoire, mais le replay devrait venir avec une gourde et une chaise.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "control_win_015",
          "title": "RESSOURCES LONGUES",
          "description": "Tu as gagné parce que ton deck respirait encore quand l'autre était déjà en dette.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_win_016",
          "title": "PARTIE VERROUILLÉE",
          "description": "Plus les tours passaient, plus le match rentrait dans ton plan. Mauvais signe pour {opponentName}.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_win_017",
          "title": "VALEUR PATIENTE",
          "description": "Le card advantage a mis du temps à parler, mais quand il parle, il parle fort.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_win_018",
          "title": "LATE LÉTAL",
          "description": "Tu as fermé tard, mais propre. Le lethal était préparé, pas improvisé.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_win_019",
          "title": "MATCH DE CONTRÔLE",
          "description": "{nbTours} tours de tension. Pas une course, une prise d'étranglement progressive.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "control_win_020",
          "title": "LA PORTE SE FERME",
          "description": "L'adversaire a tenu longtemps. Puis le contrôle a fait son travail : une fenêtre, un lethal.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_win_021",
          "title": "TU NE PASSERAS PAS",
          "description": "{nbTours} tours de verrouillage. {opponentName} a trouvé des portes, jamais la clé.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_022",
          "title": "GUERRE D'USURE",
          "description": "Chaque ressource adverse a fondu. Lent, froid, pénible, et exactement comme prévu.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_023",
          "title": "NAGE DROIT DEVANT",
          "description": "Tu as traversé la tempête sans paniquer. Le contrôle a gagné à l'endurance.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_024",
          "title": "ILS ONT LAISSÉ PASSER L'ORAGE",
          "description": "Tu as encaissé le début, puis repris le match par la value.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_025",
          "title": "MATCH DE PURISTE",
          "description": "{nbTours} tours de patience. Pas de flash inutile, juste du Card Advantage bien rangé.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_026",
          "title": "FESTIVAL DE VERROUS",
          "description": "{opponentName} a frappé à chaque porte. Ton deck avait changé les serrures.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_027",
          "title": "JUSTE UN TOUR DE PLUS",
          "description": "La partie longue t'a souri. Plus le match durait, plus ta value devenait lourde.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_028",
          "title": "ÉCHECS SUR ENCRIER",
          "description": "Ce n'était plus Lorcana, c'était une partie d'échecs avec des lore à la fin.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_029",
          "title": "PATIENCE ROYALE",
          "description": "Tu as refusé le chaos. Chaque trade a préparé la fin comme une longue cuisson.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_030",
          "title": "LE CONTRÔLE A PARLÉ",
          "description": "{opponentName} jouait des cartes. Toi, tu jouais les ressources.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_031",
          "title": "ATTRITION TOTALE",
          "description": "Le board adverse s'est usé sur tes réponses. Au bout, il ne restait que ton plan.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_032",
          "title": "PAS DE CAPE, QUE DES RÉPONSES",
          "description": "Le contrôle n'avait pas besoin de voler. Il avait juste réponse à tout.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_033",
          "title": "LA PORTE AVALÉE",
          "description": "Tu as verrouillé la porte, puis avalé la clé. {opponentName} a joué dans le couloir.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_034",
          "title": "LONG MATCH, MAIN FROIDE",
          "description": "{nbTours} tours sans perdre le fil. C'est la marque d'un vrai plan contrôle.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_035",
          "title": "LA VALUE AU MÉTIER",
          "description": "Rien de spectaculaire à chaque tour, mais l'ensemble a fini par étouffer le match.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_036",
          "title": "PROLONGATION MAÎTRISÉE",
          "description": "Dans le temps additionnel, tu avais encore des réponses. {opponentName} avait surtout des regrets.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_037",
          "title": "LE BOARD SOUS SURVEILLANCE",
          "description": "Chaque menace a été contrôlée avant de devenir un problème de lore.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_038",
          "title": "JUST KEEP SWIMMING",
          "description": "Long, tendu, mais jamais perdu. Tu as continué jusqu'à user la partie.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_039",
          "title": "GUICHET FERMÉ",
          "description": "Les menaces adverses prenaient un ticket. Aucune n'a été appelée à temps.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_win_040",
          "title": "LA FINANCE DU LATE GAME",
          "description": "Tu as investi tôt en réponses, puis encaissé la value quand le match s'est allongé.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "topdeck_win",
      "label": "Victoire malgré top deck",
      "priority": 78,
      "conditions": {
        "isWin": true,
        "toursTopDeckMin": 3
      },
      "tags": [
        "win",
        "topdeck"
      ],
      "lines": [
        {
          "id": "topdeck_win_001",
          "title": "GAGNÉ À SEC",
          "description": "{toursTopDeck} tours en top deck et quand même la win. Ce n'est pas propre, mais c'est solide mentalement.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_002",
          "title": "MAIN VIDE, CŒUR PLEIN",
          "description": "Tu as joué avec peu d'options, mais assez de pression déjà posée pour finir.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_003",
          "title": "PRIÈRE EXAUCÉE",
          "description": "Le top deck n'a pas tout ruiné. Le board avait déjà mis le match sur les bons rails.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "topdeck_win_004",
          "title": "SURVIE AU HASARD",
          "description": "La main était légère, mais le score a tenu. Le replay conseille quand même plus de pioche.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_005",
          "title": "DERNIÈRE CARTOUCHE",
          "description": "Pas beaucoup de munitions, mais les bonnes au bon moment. Ça passe.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_006",
          "title": "À COURT, MAIS VIVANT",
          "description": "{toursTopDeck} tours à la limite. Tu as gagné avant que le manque de cartes te rattrape.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_007",
          "title": "TOP DECK ET VICTOIRE",
          "description": "C'est risqué, mais cette fois la table était déjà assez avancée pour conclure.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_008",
          "title": "PLAN DÉJÀ POSÉ",
          "description": "Même sans main, ton board avait fait l'avance. {opponentName} n'a pas su punir.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_win_009",
          "title": "ÉCONOMIE TENDUE",
          "description": "La win est là, mais {toursTopDeck} tours en main vide, c'est un voyant orange.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_010",
          "title": "VICTOIRE EN APNÉE",
          "description": "Tu as fini sans beaucoup respirer. Le score valide, la méthode demande review.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "topdeck_win_011",
          "title": "MAIN FANTÔME",
          "description": "La main a disparu, le lethal non. C'est mieux que l'inverse.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "topdeck_win_012",
          "title": "FIL DE FER",
          "description": "Peu d'options, beaucoup de tension. Tu as marché jusqu'au bout sans tomber.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_013",
          "title": "LÉGER EN MAIN",
          "description": "Tu as gagné malgré un card advantage suspect. À ne pas transformer en habitude.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_014",
          "title": "TOP DECK SURVIVANT",
          "description": "La pioche a joué les arbitres, mais ton avance a suffi pour fermer.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_015",
          "title": "PAS DE RÉSERVE",
          "description": "{toursTopDeck} tours presque à vide. La victoire cache un vrai signal de deckbuilding.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_016",
          "title": "VICTOIRE FRAGILE",
          "description": "C'est gagné, mais si {opponentName} avait tenu un tour de plus, la main vide devenait un problème.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_win_017",
          "title": "BATTERIE FAIBLE",
          "description": "Tu as franchi la ligne avec 3% de batterie. Belle win, mais recharge la pioche.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "topdeck_win_018",
          "title": "AU TALENT BRUT",
          "description": "La main ne suivait plus, mais les décisions ont tenu. Pas académique, très efficace.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_019",
          "title": "FIN SANS FILET",
          "description": "Pas de card advantage confortable, juste assez de board et de sang-froid.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "topdeck_win_020",
          "title": "ÇA TIENT DEBOUT",
          "description": "Le moteur a toussé, mais il n'a pas calé avant la ligne d'arrivée.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_win_021",
          "title": "LA VIE TROUVE UN CHEMIN",
          "description": "{toursTopDeck} tours presque à sec, mais le deck a gardé un plan de secours.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_022",
          "title": "SECOND POTEAU TOP DECK",
          "description": "La carte est arrivée de nulle part. {opponentName} a juste eu le temps de regarder la lucarne.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_023",
          "title": "L'AGRIPPE",
          "description": "Une seule pioche, la bonne. Le deck a sorti le grappin au moment exact.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_024",
          "title": "PRIÈRE ACCEPTÉE",
          "description": "Le top deck n'était pas propre, mais il était légal. Et surtout, il était létal.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_025",
          "title": "MAIN VIDE, MIRACLE PLEIN",
          "description": "Tu n'avais presque plus rien, sauf assez de destin pour finir.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_026",
          "title": "RNG AVEC COSTUME",
          "description": "La variance est entrée en scène, très bien habillée, et t'a offert la sortie.",
          "tone": "gaming",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_027",
          "title": "ÇA L'EST MAINTENANT",
          "description": "{opponentName} croyait que c'était fini. Ta pioche a corrigé le commentaire.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_028",
          "title": "SUR UN MALENTENDU",
          "description": "À force de top deck, ça pouvait marcher. Spoiler : ça a marché.",
          "tone": "pop_fr",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_029",
          "title": "LE DESTIN AU DESSUS",
          "description": "Tu as joué léger en main, lourd en culot. La pioche a validé.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_030",
          "title": "CAVIAR DE PIOCHE",
          "description": "Le deck t'a servi la carte parfaite. Il ne restait qu'à pousser au fond.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_031",
          "title": "PAS TRÈS PROPRE, MAIS PRO",
          "description": "{toursTopDeck} tours à sec, et pourtant la win. La méthode est discutable, le résultat non.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_032",
          "title": "TOP DECK DE LUXE",
          "description": "Quand la main est vide, chaque pioche a une caméra sur elle. Celle-ci a pris la lumière.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_033",
          "title": "LA BOÎTE DE CHOCOLATS",
          "description": "On ne savait pas ce que tu allais piocher. Heureusement, c'était comestible.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_034",
          "title": "LE DECK A RÉPONDU",
          "description": "Au pire moment pour {opponentName}, ton deck a enfin décroché le téléphone.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_035",
          "title": "BRAVO LA VARIANCE",
          "description": "Ce n'était pas un plan A. C'était le plan RNG, mais il compte pareil.",
          "tone": "gaming",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_036",
          "title": "LA CARTE QUI SAUVE",
          "description": "Une seule option, une seule fenêtre, et assez de lore pour fermer la partie.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_037",
          "title": "MON PRÉCIEUX TOP DECK",
          "description": "Tu as trouvé la bonne carte et tu ne l'as pas lâchée. {opponentName} a senti le froid.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_038",
          "title": "LE STADE N'EN REVIENT PAS",
          "description": "La pioche a fait basculer le match. Même le board a demandé un replay.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_039",
          "title": "MIRACLE CONTRÔLÉ",
          "description": "Ce n'était pas entièrement prévu, mais tu avais préparé la table pour que le miracle compte.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_win_040",
          "title": "TOMBER AVEC PANACHE",
          "description": "La ligne était bancale, mais la chute a produit une victoire. On note le style.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "perfect_loss",
      "label": "Défaite à zéro",
      "priority": 100,
      "conditions": {
        "isWin": false,
        "monScoreEquals": 0,
        "scoreAdverseMin": 20
      },
      "tags": [
        "loss",
        "stomp"
      ],
      "lines": [
        {
          "id": "perfect_loss_001",
          "title": "ZÉRO POINTÉ",
          "description": "{monScore}-{scoreAdverse}. La game n'a pas commencé pour toi, elle a juste démarré pour {opponentName}.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_002",
          "title": "RIEN N'EST PASSÉ",
          "description": "Aucun lore, aucune traction. Le replay ressemble à un contrôle technique refusé.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_003",
          "title": "GAME À EFFACER",
          "description": "Le score est violent. Analyse rapide : tout a cassé avant que le plan existe.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_loss_004",
          "title": "SILENCE RADIO",
          "description": "Zéro lore au compteur. Même la clock a semblé gênée de continuer.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_005",
          "title": "ACCIDENT INDUSTRIEL",
          "description": "Quand tu termines à zéro, ce n'est plus un signal faible. C'est une alarme incendie.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_006",
          "title": "LE NÉANT TACTIQUE",
          "description": "Pas de board, pas de course, pas de retour. {opponentName} a joué seul avec témoin.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_007",
          "title": "RETOUR AU LABO",
          "description": "Cette game mérite moins un résumé qu'une autopsie. Mulligan, curve, réponses : tout est à revoir.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_loss_008",
          "title": "AUCUNE ENTRÉE",
          "description": "Tu n'as jamais trouvé la porte d'entrée du match. L'adversaire a fermé derrière lui.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_loss_009",
          "title": "GAME FANTÔME",
          "description": "Zéro lore, zéro momentum. Le deck était présent, le plan beaucoup moins.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_010",
          "title": "LIGNE PLATE",
          "description": "Le score est resté muet de ton côté. Pas un sprint adverse, une coupure de courant.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_loss_011",
          "title": "TAPIS ROULANT ADVERSE",
          "description": "{opponentName} a avancé tranquillement pendant que ton score refusait de bouger.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "perfect_loss_012",
          "title": "DÉPART RATÉ",
          "description": "Difficile de parler de comeback quand le match n'a jamais accroché la première vitesse.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_loss_013",
          "title": "RAFIKI AVAIT RAISON",
          "description": "Le passé peut faire mal. Celui-là surtout. La VOD servira d'entraînement.",
          "tone": "disney_hint",
          "intensity": 2
        },
        {
          "id": "perfect_loss_014",
          "title": "STADE VIDE",
          "description": "Tu n'as jamais mis le public dans la partie. {opponentName} a joué son match à domicile.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_loss_015",
          "title": "COUPURE GÉNÉRALE",
          "description": "La curve, la main et le tempo ont sauté en même temps. Zéro lore, zéro mystère.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "perfect_loss_016",
          "title": "DOSSIER SENSIBLE",
          "description": "Cette défaite part directement dans le dossier deckbuilding. Le score ne pardonne rien.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_loss_017",
          "title": "MUR INTÉGRAL",
          "description": "Tu as tapé contre un mur pendant que {opponentName} marquait sans retour.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_loss_018",
          "title": "GAME VERROUILLÉE",
          "description": "L'adversaire t'a refusé chaque fenêtre. À zéro lore, le diagnostic est brutal.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "perfect_loss_019",
          "title": "PAS AUJOURD'HUI",
          "description": "Rien n'est passé, rien n'a collé. Le plan est resté dans le vestiaire.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "perfect_loss_020",
          "title": "SCORE GLAÇANT",
          "description": "{scoreAdverse} en face, {monScore} chez toi. Même le coach local tousse avant de commenter.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "perfect_loss_021",
          "title": "PAS ÇA",
          "description": "Pas aujourd'hui, pas maintenant. La game a commencé sans toi et fini sans lore.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_022",
          "title": "HOUSTON, PROBLÈME",
          "description": "Score vierge, board compliqué, plan introuvable. Le centre de contrôle demande une enquête.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_023",
          "title": "LE PASSÉ FAIT MAL",
          "description": "Ce replay va piquer. Mais il montre très bien où le plan s'est effondré.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_024",
          "title": "ZÉRO AU TABLEAU",
          "description": "{opponentName} a joué un match. Toi, tu as regardé une bande-annonce très triste.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_025",
          "title": "IL N'Y A PAS EU PHOTO",
          "description": "Le score {monScore}-{scoreAdverse} est brutal, mais pas spécialement menteur.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_026",
          "title": "MAUVAIS LEVIER",
          "description": "Tout est parti du mauvais côté. Kronk aurait demandé une pause technique.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_027",
          "title": "LA LUMIÈRE S'EST ÉTEINTE",
          "description": "Aucun lore, aucune traction. Le stade a compris avant le joueur.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_028",
          "title": "DÉSHONNEUR SUR LA CURVE",
          "description": "Le deck n'a jamais trouvé son rythme. La honte reste statistique, pas personnelle.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_029",
          "title": "SORTIE DE ROUTE",
          "description": "Pas un virage pris correctement. La partie a fini dans le décor avant le milieu de match.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_030",
          "title": "RIEN À SIGNALER",
          "description": "Côté lore, le rapport est simple : aucune activité détectée.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_031",
          "title": "TOURNER LA PAGE",
          "description": "C'est une soirée à oublier, mais un replay à disséquer. La douleur a des données.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_032",
          "title": "LE MATCH A DISPARU",
          "description": "Ton plan de jeu avait une cape d'invisibilité. Problème : même toi tu ne l'as pas vu.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_033",
          "title": "ON NE PASSE PAS",
          "description": "{opponentName} a monté le mur, et tu n'as jamais trouvé la porte.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_034",
          "title": "PAS DE PALAIS",
          "description": "Pas de curve, pas de board. Pas de board, pas de lore. Pas de lore, pas de palais.",
          "tone": "pop_fr",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_035",
          "title": "SILENCE RADIO",
          "description": "Le deck n'a pas répondu. Même E.T. aurait eu une meilleure connexion maison.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_036",
          "title": "LE TUTORIEL ADVERSE",
          "description": "{opponentName} a pu dérouler sans interruption. Ça ressemblait plus à un test qu'à un match.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_037",
          "title": "SOIRÉE SANS BALLON",
          "description": "Tu as couru derrière tout, sans jamais toucher la partie.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_038",
          "title": "BANC DE TOUCHE",
          "description": "Le match a été joué, mais ton plan est resté assis avec la veste.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_039",
          "title": "ZÉRO PRESSION",
          "description": "Aucun lore pour menacer, aucun tempo pour inquiéter. {opponentName} a respiré trop librement.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "perfect_loss_040",
          "title": "APPELLE RAFIKI",
          "description": "Le passé peut faire mal. Là, il va surtout servir de support de coaching.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "stomp_loss",
      "label": "Large défaite",
      "priority": 91,
      "conditions": {
        "isWin": false,
        "monScoreMax": 7
      },
      "tags": [
        "loss",
        "stomp"
      ],
      "lines": [
        {
          "id": "stomp_loss_001",
          "title": "LE ROULEAU COMPRESSEUR",
          "description": "Défaite {monScore}-{scoreAdverse}. {opponentName} a pris le rythme et tu as couru derrière tout le match.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "stomp_loss_002",
          "title": "DANS LES CORDES",
          "description": "Tu as subi trop tôt. Le board adverse a dicté la game pendant que ton plan cherchait l'air.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "stomp_loss_003",
          "title": "RETOUR AU LOBBY",
          "description": "Le score fait mal, mais il est honnête. Tu n'as jamais stabilisé assez longtemps.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "stomp_loss_004",
          "title": "BOUCHERIE TACTIQUE",
          "description": "L'adversaire a pris Card, Ink et Lore Advantage. Difficile de gagner sans une seule ressource devant.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "stomp_loss_005",
          "title": "SORTIE DE ROUTE",
          "description": "La curve a glissé et le match est parti avec. {opponentName} n'a pas attendu les secours.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "stomp_loss_006",
          "title": "OUTPLAY COMPLET",
          "description": "Chaque fenêtre a été punie. La VOD risque de piquer, mais elle sera utile.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_007",
          "title": "TEMPO BROYÉ",
          "description": "Tu as perdu le rythme tôt et tu ne l'as jamais récupéré. Le score final confirme.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_008",
          "title": "SOUS PRESSION",
          "description": "Le board adverse était trop large, trop vite. Ton plan n'a pas eu le temps de respirer.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_009",
          "title": "PAS LE MÊME MATCH",
          "description": "{opponentName} jouait tempo, toi tu cherchais le mode d'emploi. Dure soirée.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "stomp_loss_010",
          "title": "LEÇON REÇUE",
          "description": "Ce n'est pas une petite défaite. C'est un rappel brutal sur la gestion des premiers tours.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_011",
          "title": "CLOCK ÉCRASANTE",
          "description": "La pression au lore est montée trop vite. À {monScore}, tu étais déjà hors course.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_012",
          "title": "PAS DE STABILISATION",
          "description": "Tu n'as jamais posé le frein. Une fois derrière, chaque tour a creusé l'écart.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_013",
          "title": "FRAPPE LOURDE",
          "description": "Le score {monScore}-{scoreAdverse} résume le problème : trop peu de réponses, trop tard.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_loss_014",
          "title": "DÉFAITE SÈCHE",
          "description": "Pas de suspense, pas de retournement. Juste un plan adverse qui s'est installé sans permission.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_loss_015",
          "title": "BOARD PERDU",
          "description": "Quand le plateau part aussi tôt, le lore suit. Tu as défendu en retard permanent.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_016",
          "title": "PLAN CASSÉ",
          "description": "Ton moteur n'a jamais vraiment tourné. {opponentName} a puni chaque tour faible.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_017",
          "title": "EN CHANTIER",
          "description": "Cette game demande de revoir la main de départ et les réponses early. Le score ne ment pas.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "stomp_loss_018",
          "title": "LE SEUM TECHNIQUE",
          "description": "Pas juste de la malchance : il y a des décisions à reprendre dans le replay.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_019",
          "title": "MUR ADVERSE",
          "description": "Tu as cherché l'ouverture, l'adversaire a posé du béton. Fin logique.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "stomp_loss_020",
          "title": "DÉBORDÉ",
          "description": "Trop de menaces, pas assez de réponses. La partie a été jouée dans ton rétroviseur.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "stomp_loss_021",
          "title": "PAS ÇA ZINÉDINE",
          "description": "Défaite {monScore}-{scoreAdverse}. Le match avait encore une dignité, puis la curve a pris rouge.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_022",
          "title": "HOUSTON, GROS PROBLÈME",
          "description": "{opponentName} a installé le board pendant que ton tempo cherchait une prise.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_023",
          "title": "IL N'Y A PAS EU PHOTO",
          "description": "Le score est lourd, et malheureusement il raconte assez bien le match.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_024",
          "title": "LE ROULEAU EN FACE",
          "description": "{opponentName} a pris l'axe central et tout écrasé. Ton board a servi de ralentisseur.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_025",
          "title": "SOIRÉE À OUBLIER",
          "description": "Le replay, lui, ne t'oubliera pas. Il a gardé chaque retard de tempo.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_026",
          "title": "LE PLAN A EXPLOSÉ",
          "description": "Belle idée sur le papier. Sur le board, ça a pris l'eau dès les premiers tours.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_027",
          "title": "DÉFENSE EN CARTON",
          "description": "La pression adverse est passée trop facilement. Le lore a coulé comme une fuite non réparée.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_028",
          "title": "MAUVAIS LEVIER",
          "description": "La mauvaise décision a lancé le chaos, puis le chaos a pris le volant.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_029",
          "title": "LE CHÂTEAU S'ÉCROULE",
          "description": "À force de subir, la structure a lâché. {opponentName} n'a plus eu qu'à pousser.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_030",
          "title": "MATCH SANS LUMIÈRE",
          "description": "Le tournant est arrivé tôt, puis personne n'a retrouvé l'interrupteur.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_031",
          "title": "RETOUR AU LOBBY",
          "description": "La game a été brutale. Pas de honte, mais beaucoup de matière pour la VOD.",
          "tone": "esport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_032",
          "title": "OUTPLAY COMPLET",
          "description": "{opponentName} a mieux lu le tempo, mieux converti les ressources, mieux fermé la partie.",
          "tone": "esport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_033",
          "title": "IL A PAYÉ CASH",
          "description": "Chaque retard a coûté du lore. La sanction est arrivée sans délai de livraison.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_034",
          "title": "SEUM MAIS DONNÉES",
          "description": "Ça pique, mais au moins les stats parlent. Le tempo a été perdu trop tôt.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_035",
          "title": "TU NE PASSERAS PAS",
          "description": "Le mur adverse était là. Ton plan a frappé dessus jusqu'à la fin.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_036",
          "title": "LA COURBE AU VESTIAIRE",
          "description": "La curve n'est jamais entrée sur le terrain. {opponentName}, lui, jouait déjà.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_037",
          "title": "BOARD CONFISQUÉ",
          "description": "Tu as tenté d'exister, mais le plateau avait déjà choisi son propriétaire.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_038",
          "title": "LE TEMPO A FUJI",
          "description": "Le rythme est parti très loin, sans laisser d'adresse de retour.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_039",
          "title": "DÉFAITE ADMINISTRATIVE",
          "description": "Dossier incomplet : pas assez de board, pas assez de lore, trop de retard.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "stomp_loss_040",
          "title": "RÊVE BLEU, ÉCRAN NOIR",
          "description": "Le plan pouvait être beau. La partie, elle, a surtout affiché un écran noir.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "close_loss",
      "label": "Défaite sur le fil",
      "priority": 88,
      "conditions": {
        "isWin": false,
        "scoreGapMax": 3,
        "scoreAdverseMin": 18
      },
      "tags": [
        "loss",
        "clutch"
      ],
      "lines": [
        {
          "id": "close_loss_001",
          "title": "LA CLIM FINALE",
          "description": "Défaite {monScore}-{scoreAdverse}. Tu étais à un souffle du lethal, et le stade s'est éteint.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "close_loss_002",
          "title": "CRUEL, TRÈS CRUEL",
          "description": "La course au lore s'est jouée à rien. Un trade, une pioche, un tour : voilà le prix.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_003",
          "title": "LE SEUM TOTAL",
          "description": "Tu as touché la victoire du bout des doigts. {opponentName} a fermé juste avant toi.",
          "tone": "sport",
          "intensity": 3
        },
        {
          "id": "close_loss_004",
          "title": "À UN LORE PRÈS",
          "description": "Le score est serré, mais la défaite reste réelle. C'est le genre de VOD qui hante.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_005",
          "title": "BRAQUAGE RATÉ",
          "description": "Tu avais la caisse presque ouverte. L'adversaire a remis le verrou au dernier moment.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "close_loss_006",
          "title": "LETHAL MANQUÉ",
          "description": "Il a manqué une goutte de value pour transformer cette tension en victoire.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_loss_007",
          "title": "DERNIER VIRAGE",
          "description": "La ligne était visible. Tu as perdu l'adhérence au pire moment.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_008",
          "title": "PHOTO-FINISH PERDU",
          "description": "Deux clocks, un finish, et pas le bon nom sur le tableau final.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_009",
          "title": "SI PROCHE",
          "description": "La game n'était pas mauvaise. Elle était juste trop serrée pour pardonner une décision floue.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "close_loss_010",
          "title": "DOULOUREUX",
          "description": "Tu avais assez de plan pour y croire, pas assez de marge pour survivre.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_011",
          "title": "LE TOP DECK ADVERSE",
          "description": "Quand la partie finit aussi près, chaque carte piochée ressemble à une trahison.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_012",
          "title": "PRESQUE HOLD-UP",
          "description": "Tu as failli voler la fin. {opponentName} a trouvé le dernier verrou.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "close_loss_013",
          "title": "TENSION MAXIMALE",
          "description": "{nbTours} tours et une défaite à portée de main. C'est frustrant, mais riche à analyser.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "close_loss_014",
          "title": "COUTEAU ENTRE LES DENTS",
          "description": "La bataille était vraie. Le finish a juste choisi l'autre côté.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_015",
          "title": "CLUTCH ADVERSE",
          "description": "{opponentName} a gagné la dernière décision importante. C'est souvent là que tout se joue.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_loss_016",
          "title": "GAME DE DÉTAILS",
          "description": "Pas une humiliation : une défaite de micro-décisions. Le replay vaut de l'or.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "close_loss_017",
          "title": "TOUR DE TROP",
          "description": "Tu as peut-être laissé une fenêtre ouverte un tour. L'adversaire est entré sans frapper.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "close_loss_018",
          "title": "LIGNE BRISÉE",
          "description": "La course était parfaite jusqu'à la dernière haie. Dommage, elle comptait double.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_019",
          "title": "LE DERNIER MOT",
          "description": "Tu as parlé fort tout le match. {opponentName} a eu la dernière phrase.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_020",
          "title": "FIN SOUS ASPIRINE",
          "description": "C'est la défaite qui donne envie de relancer direct. Pas pour tilt, pour comprendre.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "close_loss_021",
          "title": "PAS AUJOURD'HUI",
          "description": "Défaite {monScore}-{scoreAdverse}. C'était proche, donc forcément plus cruel.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_022",
          "title": "PAS MAINTENANT",
          "description": "Le lethal était presque là. Le match a choisi la tragédie au dernier moment.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_023",
          "title": "CRUEL, SI CRUEL",
          "description": "Un lore, un trade, une pioche. La défaite a pris le chemin le plus douloureux.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_024",
          "title": "PHOTO-FINISH PERDU",
          "description": "La ligne était là, mais {opponentName} a passé le nez devant au pire instant.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_025",
          "title": "LE TOP DECK ADVERSE",
          "description": "Tu avais presque fermé la porte. La pioche adverse a trouvé le double des clés.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_026",
          "title": "À UN POIL",
          "description": "Il manquait presque rien. Ce qui, statistiquement, est la manière la plus vexante de perdre.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_027",
          "title": "LA CLIM FINALE",
          "description": "Le stade y croyait, puis le dernier tour a coupé le chauffage.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_028",
          "title": "LETHAL MANQUÉ",
          "description": "Il était quelque part sur la table. Apparemment, il portait une cape d'invisibilité.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_029",
          "title": "OH NON, PAS ÇA",
          "description": "La game ne devait pas finir comme ça. Mais la curve adverse avait le dernier mot.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_030",
          "title": "REMBOURSEMENT ÉMOTIONNEL",
          "description": "Une défaite aussi proche devrait venir avec un formulaire de réclamation.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_031",
          "title": "LE FIL A CASSÉ",
          "description": "Tu as tenu la corde longtemps. Elle a lâché au dernier mètre.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_032",
          "title": "LA VIE TROUVE UN CHEMIN",
          "description": "Malheureusement, cette fois, c'était surtout la vie du board adverse.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_033",
          "title": "HOLD-UP SUBI",
          "description": "La partie était prenable, puis {opponentName} est reparti avec le sac.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_034",
          "title": "LE BUZZER EN FACE",
          "description": "Le money time a parlé, mais pas avec ta voix. Cruel et très éducatif.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_035",
          "title": "PRESQUE HÉROS",
          "description": "Le comeback avait mis la cape. Il a trébuché avant le plan final.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_036",
          "title": "UN DÉTAIL, UNE DOULEUR",
          "description": "Tout s'est joué sur un détail. Traduction : ça va rester dans la tête.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_037",
          "title": "C'EST PAS FAUX",
          "description": "Dire que c'était jouable n'aide pas. Mais oui, c'était vraiment jouable.",
          "tone": "pop_fr",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_038",
          "title": "LA PORTE OUVERTE",
          "description": "Tu as laissé une fenêtre, {opponentName} est entré avec les chaussures sales.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_039",
          "title": "FIN À LA GILARDI",
          "description": "Pas ça, pas après tout ce travail. Le dernier tour a fait très mal.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "close_loss_040",
          "title": "DERNIER VIRAGE RATÉ",
          "description": "La trajectoire était bonne, puis le match a glissé sur la dernière action.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "topdeck_loss",
      "label": "Défaite par panne de main",
      "priority": 97,
      "conditions": {
        "isWin": false,
        "toursTopDeckMin": 3
      },
      "tags": [
        "loss",
        "card_advantage",
        "topdeck"
      ],
      "lines": [
        {
          "id": "topdeck_loss_001",
          "title": "PRIÈRE ET TOP DECK",
          "description": "{toursTopDeck} tours presque à vide. Sans Card Advantage, tu as joué au casino.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "topdeck_loss_002",
          "title": "PANNE SÈCHE",
          "description": "La main a disparu, puis le plan avec. {opponentName} n'avait plus qu'à dérouler.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "topdeck_loss_003",
          "title": "DÉSERT TACTIQUE",
          "description": "À court de cartes pendant {toursTopDeck} tours, tu n'avais plus assez d'options pour répondre.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_004",
          "title": "MAIN VIDE, MATCH VIDE",
          "description": "Le board demandait des réponses. Ta main a répondu par un grand silence.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "topdeck_loss_005",
          "title": "TOP DECK SIMULATOR",
          "description": "Quand chaque tour devient une prière à la pioche, le tempo appartient déjà à l'autre.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "topdeck_loss_006",
          "title": "ASPHYXIE TOTALE",
          "description": "Le moteur de pioche a calé. L'adversaire a gagné l'oxygène et la partie.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_007",
          "title": "PLUS DE MUNITIONS",
          "description": "On ne gagne pas longtemps sans cartes. {toursTopDeck} tours à sec, c'est trop.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_008",
          "title": "LA PAGE BLANCHE",
          "description": "Tu as passé trop de tours à attendre une réponse. {opponentName} a écrit la fin.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_009",
          "title": "DECK EN APNÉE",
          "description": "La main n'a pas suivi la pression. Ton plan s'est étouffé avant le lethal.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_010",
          "title": "CARD ADVANTAGE PERDU",
          "description": "Le signal est clair : moins de cartes, moins de choix, moins de match.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_011",
          "title": "PIOCHE OU RIEN",
          "description": "La stratégie ne peut pas reposer sur un miracle par tour. Cette fois, le miracle était absent.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_012",
          "title": "MOTEUR CALÉ",
          "description": "Le deck voulait avancer, mais la main était en panne. Le tempo est resté chez {opponentName}.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_013",
          "title": "CARTOUCHES BRÛLÉES",
          "description": "Tu as vidé trop vite. Une fois les réponses parties, le board adverse a respiré librement.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_014",
          "title": "MODE SPECTATEUR",
          "description": "Sans cartes en main, tu as regardé la partie te passer devant. Brutal, mais instructif.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "topdeck_loss_015",
          "title": "LA MAIN FANTÔME",
          "description": "Elle était censée jouer la game. Elle a disparu au pire moment.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_016",
          "title": "TROP SEC",
          "description": "Même avec un bon plan, {toursTopDeck} tours à 0 ou 1 carte finissent par casser la machine.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_017",
          "title": "RESSOURCES INVISIBLES",
          "description": "Tu avais peut-être de l'encre, mais sans cartes, l'encre ne menace personne.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_018",
          "title": "DRAW ENGINE SUSPECT",
          "description": "Ce match réclame un audit de pioche. La main vide a coûté plus que le score ne le dit.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_019",
          "title": "PANNE D'ESSENCE",
          "description": "Le véhicule était lancé, mais le réservoir de cartes était vide. Fin de trajet.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_020",
          "title": "SANS FILET",
          "description": "Tu as joué trop longtemps sans réserve. Face à une clock active, ça pardonne rarement.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "topdeck_loss_021",
          "title": "PRIÈRE ET DÉFAITE",
          "description": "{toursTopDeck} tours à attendre la bonne carte. Le deck a répondu trop tard.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_022",
          "title": "PAGE BLANCHE",
          "description": "La main était vide, le plan aussi. {opponentName} n'avait plus qu'à lire la fin.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_023",
          "title": "DÉSERT TACTIQUE",
          "description": "Le Card Advantage est parti sans laisser d'eau. Tu as joué la soif.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_024",
          "title": "LA BOÎTE ÉTAIT VIDE",
          "description": "La vie c'est comme une pioche. Là, elle avait surtout laissé les chocolats en face.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_025",
          "title": "TOP DECK MODE",
          "description": "{toursTopDeck} tours en mode loterie. À ce niveau, même la RNG demande une pause.",
          "tone": "gaming",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_026",
          "title": "L'AGRIPPE A RATÉ",
          "description": "Tu cherchais la carte de secours. Le grappin a attrapé du vide.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_027",
          "title": "LE DECK AU SILENCE",
          "description": "Tu appelais des réponses, mais la pioche avait mis son téléphone en avion.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_028",
          "title": "PAS DE MUNITIONS",
          "description": "On ne gagne pas une guerre d'attrition avec une main en brochure touristique.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_029",
          "title": "MON PRÉCIEUX INTROUVABLE",
          "description": "La carte clé était quelque part dans le deck. Malheureusement, la partie aussi.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_030",
          "title": "HOUSTON, MAIN VIDE",
          "description": "{toursTopDeck} tours avec trop peu d'options. Le centre de contrôle a perdu le signal.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_031",
          "title": "LE DESTIN EN PANNE",
          "description": "Le match demandait une réponse. La pioche a envoyé un accusé de réception.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_032",
          "title": "TROP PEU, TROP TARD",
          "description": "La bonne carte pouvait exister. Elle a surtout existé après l'urgence.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_033",
          "title": "SPECTATEUR DE TA PIOCHE",
          "description": "Quand la main tombe à sec, le joueur devient commentateur de son propre malheur.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_034",
          "title": "PLUS DE CARTES, PLUS DE PLAN",
          "description": "Le board adverse a grandi pendant que ton deck cherchait la prochaine phrase.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_035",
          "title": "NAGE DROIT DANS LE VIDE",
          "description": "Tu as continué, mais sans main, chaque tour ressemblait à un couloir trop long.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_036",
          "title": "CASINO LORCANA",
          "description": "Une pioche par tour, une prière par tour. Le croupier n'a pas été généreux.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_037",
          "title": "LE STOCK ÉTAIT FINI",
          "description": "Le magasin des réponses était fermé. {opponentName} a profité des soldes.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_038",
          "title": "RNG CÔTÉ FROID",
          "description": "La variance a pris le micro, puis a annoncé une mauvaise nouvelle.",
          "tone": "gaming",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_039",
          "title": "LE MOTEUR A CALÉ",
          "description": "Sans pioche, ton deck a perdu sa respiration. Le tempo adverse a pris toute la route.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "topdeck_loss_040",
          "title": "MAIN VIDE, STADE VIDE",
          "description": "Même le public a senti que la prochaine pioche portait trop de pression.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "ink_leak_loss",
      "label": "Défaite par encre flottée",
      "priority": 96,
      "conditions": {
        "isWin": false,
        "inkFloatMin": 10
      },
      "tags": [
        "loss",
        "ink_advantage",
        "tempo"
      ],
      "lines": [
        {
          "id": "ink_leak_loss_001",
          "title": "FUITE D'ENCRE",
          "description": "{inkFloat} encres flottées. À ce niveau, ce n'est plus une ressource, c'est une piscine.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_002",
          "title": "OÙ EST LE TEMPO",
          "description": "Tu avais l'encre, pas l'impact. {opponentName} a transformé ce vide en avance.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_003",
          "title": "ENCRE AU PARKING",
          "description": "Trop de ressources non dépensées. Pendant que ton encrier dormait, le board adverse travaillait.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_004",
          "title": "CURVE EN GRÈVE",
          "description": "{inkFloat} encres inutilisées, c'est une curve qui pose un arrêt maladie.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_005",
          "title": "GASPILLAGE TOTAL",
          "description": "L'encre doit devenir du board, du removal ou du lore. Là, elle a regardé le match.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_006",
          "title": "TEMPO PERDU",
          "description": "Chaque encre flottée a donné un peu plus d'air à {opponentName}. Et il n'en demandait pas tant.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_007",
          "title": "ÉCONOMIE CASSÉE",
          "description": "Tu as généré des ressources sans les convertir. Le score final facture l'inefficacité.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_008",
          "title": "PISCINE MUNICIPALE",
          "description": "Avec {inkFloat} encres flottées, on pouvait ouvrir un bassin. Mais pas gagner ce match.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_009",
          "title": "MANA SANS MENACE",
          "description": "Avoir de l'encre ne suffit pas. Il fallait la transformer en pression, pas en décoration.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_010",
          "title": "LA BANQUE DORT",
          "description": "Ton capital était là, mais il n'a pas travaillé. L'adversaire a investi mieux.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_011",
          "title": "TOUR GRATUIT ADVERSE",
          "description": "Chaque tour sous-dépensé ressemble à une invitation pour {opponentName}.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_012",
          "title": "RESSOURCES GELÉES",
          "description": "L'encre flottée n'a pas bloqué le board, pas marqué de lore, pas sauvé la partie.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_013",
          "title": "COURBE TROUÉE",
          "description": "Le deck a produit de l'encre, mais pas assez d'actions utiles. Le tempo a fui par les côtés.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_014",
          "title": "MAUVAIS RENDEMENT",
          "description": "{inkFloat} encres non converties, c'est une défaite comptable autant que tactique.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_015",
          "title": "ACTIONS MANQUANTES",
          "description": "Tu n'as pas dépensé assez pour contester. Le board adverse a pris l'espace gratuit.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_016",
          "title": "CAPITAL GÂCHÉ",
          "description": "L'encrier était chargé, le plateau beaucoup moins. Le match n'attend pas les économies.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_017",
          "title": "TROP DE RÉSERVE",
          "description": "Garder de l'encre peut être fin. En garder {inkFloat}, c'est une donation.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "ink_leak_loss_018",
          "title": "L'ENCRE NE MARQUE PAS",
          "description": "Sans carte pour la convertir, l'encre ne fait pas de lore. Le score l'a rappelé.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_019",
          "title": "FUITE AU TOUR {MAXFLOATTURN}",
          "description": "Le plus gros trou d'air arrive tour {maxFloatTurn}. Ce genre de tour change une partie.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_020",
          "title": "BUDGET NON UTILISÉ",
          "description": "Tu avais les moyens, pas la dépense. {opponentName} a pris le marché.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "ink_leak_loss_021",
          "title": "MAUVAIS LEVIER",
          "description": "{inkFloat} encres flottées. Tu as tiré le levier du tempo, mais pas dans le bon sens.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_022",
          "title": "HOUSTON, ENCRE AU SOL",
          "description": "Tu avais les ressources. Elles sont restées au sol pendant que {opponentName} construisait le match.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_023",
          "title": "L'ENCRE DÉCORATIVE",
          "description": "{inkFloat} encres inutilisées. À ce stade, l'encrier servait surtout de mobilier.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_024",
          "title": "IL FALLAIT TUER LE MATCH",
          "description": "Tu avais de quoi agir, mais le tempo a été laissé vivant. Il s'est vengé.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_025",
          "title": "LA SANCTION IMMÉDIATE",
          "description": "Chaque encre non convertie a ouvert une fenêtre. {opponentName} est entré par toutes.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_026",
          "title": "TEMPÊTE DANS L'ENCRIER",
          "description": "Beaucoup d'eau, peu de mouvement. Le board adverse a surfé sur ton inertie.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_027",
          "title": "PAS DE CONSTRUCTION",
          "description": "Pas d'action, pas de tempo. Pas de tempo, pas de palais.",
          "tone": "pop_fr",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_028",
          "title": "LE TEMPO AU PARKING",
          "description": "{inkFloat} encres garées dehors. Pendant ce temps, le match roulait sans toi.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_029",
          "title": "TRÉSOR INUTILISÉ",
          "description": "Mon précieux encrier ne gagne pas seul. Il fallait convertir ces ressources en pression.",
          "tone": "pop",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_030",
          "title": "LA CURVE A RATÉ LE TRAIN",
          "description": "L'encre était là, le tour aussi. L'action principale, elle, est restée sur le quai.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_031",
          "title": "RENDEMENT NÉGATIF",
          "description": "Tu as économisé des encres comme si elles rapportaient des intérêts. Mauvaise banque.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_032",
          "title": "OÙ EST LE TEMPO",
          "description": "Le problème n'était pas le manque d'encre. C'était l'absence d'impact avec cette encre.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_033",
          "title": "FUITES MULTIPLES",
          "description": "{inkFloat} encres flottées, ça ne coule plus, ça inonde. Le board adverse a pris le bateau.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_034",
          "title": "PAS DE CAPE POUR LA CURVE",
          "description": "La curve ne s'est pas sauvée toute seule. Il fallait jouer les cartes, pas les contempler.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_035",
          "title": "LE BUDGET ÉTAIT LÀ",
          "description": "Tu avais les moyens, mais pas les dépenses. {opponentName} a remporté le marché.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_036",
          "title": "ENCRE EN VACANCES",
          "description": "{inkFloat} ressources disponibles et trop peu converties. Le tempo a posé ses congés.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_037",
          "title": "LE PLAN RESTE AU PAPIER",
          "description": "Belle réserve, peu d'action. La partie ne récompense pas les encres non dépensées.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_038",
          "title": "TROP D'EAU, PAS DE MOULIN",
          "description": "Les ressources étaient là, mais aucune pression n'en est sortie à temps.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_039",
          "title": "L'ÉCONOMIE S'ENDORT",
          "description": "Ink Advantage potentiel, tempo réel absent. Le match a puni l'écart entre les deux.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "ink_leak_loss_040",
          "title": "LA FACTURE DU TEMPO",
          "description": "L'encre non utilisée revient toujours. Cette fois, elle est revenue avec des intérêts.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "mulligan_brick_loss",
      "label": "Défaite par mulligan / brick",
      "priority": 94,
      "conditions": {
        "isWin": false,
        "nbMulliganMin": 4,
        "nbToursMax": 8
      },
      "tags": [
        "loss",
        "mulligan",
        "brick"
      ],
      "lines": [
        {
          "id": "mulligan_brick_loss_001",
          "title": "MULLIGAN DE LA PEUR",
          "description": "{nbMulligan} cartes renvoyées pour finir en chantier. L'ouverture a déjà mis le match en pente.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "mulligan_brick_loss_002",
          "title": "BRIQUE AU DÉMARRAGE",
          "description": "La main de départ a refusé de coopérer. {opponentName} a pris le tempo avant ton premier vrai plan.",
          "tone": "tactical",
          "intensity": 3
        },
        {
          "id": "mulligan_brick_loss_003",
          "title": "MAIN INJOUABLE",
          "description": "Quand le mulligan cherche une solution et trouve un problème, le match devient très long.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "mulligan_brick_loss_004",
          "title": "SORTIE DE PISTE",
          "description": "Le départ était trop mauvais pour une game aussi courte. Le score final suit la logique.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_005",
          "title": "RNG HOSTILE",
          "description": "La pioche n'a pas aidé, mais la VOD dira si le keep était défendable.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_006",
          "title": "CURVE CASSÉE",
          "description": "Le plan {pace} avait besoin de stabilité. La main a livré du chaos.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_007",
          "title": "MULLIGAN PUNITIF",
          "description": "Renvoyer {nbMulligan} cartes, c'est chercher de l'air. Là, tu as trouvé du béton.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "mulligan_brick_loss_008",
          "title": "DÉPART EN RETARD",
          "description": "Tu as commencé la game avec une dette de tempo. {opponentName} l'a encaissée vite.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_009",
          "title": "BRICK OFFICIEL",
          "description": "Le deck a regardé sa main et a choisi la grève. Difficile de construire là-dessus.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "mulligan_brick_loss_010",
          "title": "OUVERTURE FROIDE",
          "description": "Pas assez de curve, pas assez de réponses. L'adversaire a pris la voie rapide.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_011",
          "title": "MAUVAIS KEEP",
          "description": "Ce replay pose une question simple : ce mulligan était-il assez agressif ?",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "mulligan_brick_loss_012",
          "title": "PIOCHE PUNITIVE",
          "description": "Même avec un bon deck, une main qui ne curving pas peut offrir la partie.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_013",
          "title": "EARLY PERDU",
          "description": "La game s'est jouée avant le late. Ton départ n'a pas tenu la vitesse adverse.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_014",
          "title": "MAIN DE CHANTIER",
          "description": "Il manquait les bons coûts, les bonnes réponses ou les deux. Mauvais cocktail.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_015",
          "title": "LE DÉPART MAUDIT",
          "description": "{nbMulligan} changements et toujours pas le rythme. Ça sentait le piège dès l'ouverture.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_016",
          "title": "TROP LOURD",
          "description": "Si la main était pleine de late game, le board adverse a simplement puni l'attente.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_017",
          "title": "AUCUN TREMPLIN",
          "description": "Sans ouverture stable, impossible de transformer l'encre en pression assez vite.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_018",
          "title": "MULLIGAN SOUS PRESSION",
          "description": "Le match-up demandait une main propre. La tienne a livré un puzzle incomplet.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_019",
          "title": "RIEN À CURVE",
          "description": "Quand les premiers tours ne s'enchaînent pas, le tempo part en face sans demander.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_020",
          "title": "DÉPART SINISTRÉ",
          "description": "Le replay commence comme une alerte météo. La tempête est arrivée tour {nbTours}.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "mulligan_brick_loss_021",
          "title": "MAUVAIS LEVIER",
          "description": "{nbMulligan} cartes renvoyées, et le chaos quand même. Kronk compatit.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_022",
          "title": "DÉSHONNEUR SUR LA MAIN",
          "description": "Le mulligan devait réparer. Il a livré une brique avec emballage cadeau.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_023",
          "title": "BRIQUE AU COUP D'ENVOI",
          "description": "La partie a commencé, ton plan cherchait encore ses chaussures.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_024",
          "title": "SUR UN MALENTENDU",
          "description": "Le keep pouvait marcher. Malheureusement, le malentendu a surtout marché pour {opponentName}.",
          "tone": "pop_fr",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_025",
          "title": "OUBLIE QUE T'AS UNE CURVE",
          "description": "{nbMulligan} cartes bougées, zéro fluidité. La main avait déjà signé la souffrance.",
          "tone": "pop_fr",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_026",
          "title": "HOUSTON, OPENING MAIN",
          "description": "La main de départ envoyait des signaux inquiétants. Le centre de contrôle confirme le crash.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_027",
          "title": "PAS DE PIERRE",
          "description": "Pas de T1, pas de T2. Pas de curve, pas de palais.",
          "tone": "pop_fr",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_028",
          "title": "LE PLAN SUR LE PAPIER",
          "description": "Sur le papier, c'était jouable. Puis la main de départ a pris le papier.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_029",
          "title": "LE MULLIGAN A MENTI",
          "description": "Il a promis une solution, puis est revenu avec une liste de problèmes.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_030",
          "title": "BRICK CITY",
          "description": "La main ressemblait à un chantier. Beaucoup de matériaux, aucune route vers le tempo.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_031",
          "title": "LA RNG AU MICRO",
          "description": "La variance a annoncé la composition de départ. Le stade a compris avant toi.",
          "tone": "gaming",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_032",
          "title": "PAS AUJOURD'HUI",
          "description": "Pas maintenant, pas avec cette main. Le match a senti le sang très tôt.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_033",
          "title": "CURVE ABSENTE",
          "description": "Elle n'était pas mauvaise. Elle n'était juste pas là.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_034",
          "title": "OPENING EN PANNE",
          "description": "Le moteur n'a pas démarré. {opponentName} était déjà en troisième vitesse.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_035",
          "title": "TROP LOURD, TROP TÔT",
          "description": "La main voulait jouer le late game avant de survivre au début. Mauvais ordre.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_036",
          "title": "L'ENCRIER A PLEURÉ",
          "description": "Même les cartes en main semblaient ne pas savoir lesquelles sauver.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_037",
          "title": "MULLIGAN DE FILM D'HORREUR",
          "description": "Tu as ouvert la porte, et derrière il y avait encore la cave.",
          "tone": "cinematic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_038",
          "title": "LE DECK A CHOISI LE DRAME",
          "description": "Tu cherchais de la stabilité. Le deck a préféré le théâtre.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_039",
          "title": "MAIN EN DÉMÉNAGEMENT",
          "description": "Beaucoup de cartons, aucun plan clair. {opponentName} a profité du désordre.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "mulligan_brick_loss_040",
          "title": "APPELLE LE SCRIBE",
          "description": "Il va falloir noter cette main, puis l'enterrer dans les archives.",
          "tone": "pop_fr",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "control_loss",
      "label": "Défaite longue / attrition",
      "priority": 73,
      "conditions": {
        "isWin": false,
        "nbToursMin": 13
      },
      "tags": [
        "loss",
        "control",
        "attrition"
      ],
      "lines": [
        {
          "id": "control_loss_001",
          "title": "GUERRE D'USURE PERDUE",
          "description": "{nbTours} tours de bataille, et {opponentName} a gagné la dernière réserve de value.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_002",
          "title": "MARATHON RATÉ",
          "description": "Tu as tenu longtemps, mais le late game adverse avait plus d'essence.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_loss_003",
          "title": "ATTRITION ADVERSE",
          "description": "La partie a duré assez pour révéler les moteurs. Le sien a mieux respiré.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_004",
          "title": "TRANCHÉES HOSTILES",
          "description": "Long match, petites marges. Au bout, c'est ton card advantage qui a craqué.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_005",
          "title": "PATIENCE PUNIE",
          "description": "Attendre peut payer. Ici, ça a surtout laissé {opponentName} trouver son angle.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "control_loss_006",
          "title": "LATE GAME PERDU",
          "description": "Plus la partie avançait, plus les réponses coûtaient cher. Tu as fini à découvert.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_007",
          "title": "USURE MENTALE",
          "description": "{nbTours} tours, c'est une épreuve. L'adversaire a mieux gardé ses ressources clés.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_loss_008",
          "title": "CONTRÔLE DÉBORDÉ",
          "description": "Tu as ralenti la partie, mais pas assez la clock adverse. Mauvais équilibre.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_009",
          "title": "FIN DE RÉSERVE",
          "description": "Le plan a tenu longtemps puis a manqué d'oxygène au moment critique.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_loss_010",
          "title": "BOARD INTERMINABLE",
          "description": "Les trades ont duré, mais ils n'ont pas produit assez de lore de ton côté.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_loss_011",
          "title": "LA LONGUEUR COÛTE",
          "description": "Une partie longue pardonne moins les fuites d'encre et les cartes mortes.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "control_loss_012",
          "title": "ÉPUISEMENT",
          "description": "Tu as survécu, pas dominé. À force, {opponentName} a trouvé la faille.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_013",
          "title": "LATE SANS PUNCH",
          "description": "Le match était assez long pour gagner à la value, mais pas assez rentable pour toi.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_014",
          "title": "CONTRÔLE FISSURÉ",
          "description": "Le mur a tenu longtemps. Puis une brique a sauté, et le score avec.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_loss_015",
          "title": "VALUE ADVERSE",
          "description": "Le dernier tiers du match appartient à {opponentName}. C'est là que la défaite se signe.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_016",
          "title": "PAS ASSEZ DE FINISHER",
          "description": "Tu as géré, mais tu n'as pas conclu. Le contrôle sans lethal finit par s'user.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_017",
          "title": "TROP LONG POUR RIEN",
          "description": "{nbTours} tours pour finir derrière : la patience seule ne marque pas de lore.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "control_loss_018",
          "title": "LE VERROU SAUTE",
          "description": "Tu as contrôlé beaucoup de choses, sauf la dernière fenêtre de lethal adverse.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "control_loss_019",
          "title": "MATCH D'ÉCHECS PERDU",
          "description": "Tu as déplacé les pièces, mais {opponentName} a trouvé l'échec et mat.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_loss_020",
          "title": "FIN DE MARATHON",
          "description": "Tu arrives au bout, mais sans le sprint final. Le late game ne pardonne pas.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "control_loss_021",
          "title": "GUERRE D'USURE PERDUE",
          "description": "{nbTours} tours dans les tranchées, mais {opponentName} avait la dernière ration de value.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_022",
          "title": "JUST KEEP LOSING",
          "description": "Tu as tenu longtemps, mais nager droit devant ne suffit pas quand le courant est adverse.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_023",
          "title": "LA CLÉ EN FACE",
          "description": "Tu as verrouillé beaucoup de portes. {opponentName} avait celle de la fin.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_024",
          "title": "MATCH D'ÉCHECS PERDU",
          "description": "Chaque échange comptait. Au dernier calcul, il manquait une ressource de trop.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_025",
          "title": "LE LATE GAME T'A EU",
          "description": "Tu voulais une partie longue. Elle l'a été, puis elle t'a présenté la facture.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_026",
          "title": "ATTRITION FROIDE",
          "description": "Ce n'était pas spectaculaire. C'était pire : lentement défavorable.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_027",
          "title": "LE TEMPS ADDITIONNEL FAIT MAL",
          "description": "Dans les prolongations, {opponentName} a trouvé plus de value et moins de regrets.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_028",
          "title": "PAS DE RÉPONSE FINALE",
          "description": "Tu avais tenu le board, mais pas le dernier swing de lore.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_029",
          "title": "LA FATIGUE A PARLÉ",
          "description": "{nbTours} tours, beaucoup de décisions. Une seule de trop a ouvert la fin.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_030",
          "title": "CONTROL MIRROR, MIROIR CRUEL",
          "description": "Le plan était lent, mais le reflet adverse avait une meilleure main.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_031",
          "title": "LA VALUE S'ÉCHAPPE",
          "description": "La partie longue devait t'avantager. Elle a surtout donné plus de temps à {opponentName}.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_032",
          "title": "BATAILLE DE TRANCHÉES",
          "description": "Tu as survécu aux assauts, puis perdu sur les réserves.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_033",
          "title": "PATIENCE PUNIE",
          "description": "Attendre était correct. Attendre sans assez convertir l'était moins.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_034",
          "title": "LE MARATHON EN FACE",
          "description": "{opponentName} a mieux géré le souffle. Le sprint final n'était pas pour toi.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_035",
          "title": "ÉCONOMIE FRAGILE",
          "description": "Sur une partie aussi longue, chaque ressource perdue revient en facture.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_036",
          "title": "LE BOARD A TENU, PAS LE SCORE",
          "description": "Tu as contesté longtemps, mais la course au lore a fini par s'échapper.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_037",
          "title": "TROP LONG, TROP LOIN",
          "description": "Le match a dépassé ta fenêtre de contrôle. {opponentName} a trouvé le late game utile.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_038",
          "title": "LE TEMPO S'ÉRODE",
          "description": "Rien n'a explosé. Tout s'est simplement usé, jusqu'à ce que l'écart devienne réel.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_039",
          "title": "PAS DE FIN HEUREUSE",
          "description": "Le conte était long, mais le dernier chapitre appartenait à {opponentName}.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "control_loss_040",
          "title": "ON APPREND DU PASSÉ",
          "description": "Rafiki validerait la leçon. Cette défaite longue montre exactement où la value s'est perdue.",
          "tone": "disney_hint",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "board_grind_win",
      "label": "Victoire par trades / défis",
      "priority": 71,
      "conditions": {
        "isWin": true,
        "challengeCountMin": 8
      },
      "tags": [
        "win",
        "board",
        "challenge"
      ],
      "lines": [
        {
          "id": "board_grind_win_001",
          "title": "BOARD SOUS CADENAS",
          "description": "{challengeCount} défis cumulés. Tu as gagné la guerre du plateau avant la course au lore.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_win_002",
          "title": "TRADES RENTABLES",
          "description": "Chaque défi a nettoyé une fenêtre. {opponentName} a perdu le board pièce par pièce.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_win_003",
          "title": "ARÈNE CONTRÔLÉE",
          "description": "Tu as mis les gants et remporté les échanges. Le score est venu après.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_win_004",
          "title": "BASTON UTILE",
          "description": "Ce n'était pas du combat gratuit : les défis ont préparé le lethal.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_win_005",
          "title": "PLATEAU VERROUILLÉ",
          "description": "Tu as contesté assez pour empêcher l'adversaire de poser sa clock.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_win_006",
          "title": "TRADES DE PATRON",
          "description": "Les défis ont payé. Tu n'as pas juste tapé, tu as ouvert la route au lore.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_win_007",
          "title": "CHANTIER PROPRE",
          "description": "{challengeCount} défis, et le board adverse a fini en zone dégagée.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "board_grind_win_008",
          "title": "CONTRÔLE DE TABLE",
          "description": "Tu as gardé l'espace critique. Sans board, {opponentName} n'avait plus de plan.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_win_009",
          "title": "MAIN LOURDE",
          "description": "Tu as forcé les échanges et gagné la value. La partie a basculé au plateau.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_win_010",
          "title": "DÉFIS PAYANTS",
          "description": "Le combat a produit du temps, puis le temps a produit du lore. Très propre.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_win_011",
          "title": "PAS DE QUARTIER",
          "description": "Chaque personnage adverse a payé son ticket d'entrée. La table est restée à toi.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "board_grind_win_012",
          "title": "BOARD FIRST",
          "description": "Tu as choisi le contrôle avant la course. Le choix a payé au moment de conclure.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_win_013",
          "title": "BASTON CALCULÉE",
          "description": "Les trades étaient mathématiques, pas émotionnels. C'est souvent là que ça gagne.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_win_014",
          "title": "TEMPO PAR DÉFI",
          "description": "Tu as remplacé la vitesse par le contrôle. {opponentName} a manqué de menaces.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_win_015",
          "title": "ARBITRE SÉVÈRE",
          "description": "Le board adverse entrait, tu le sortais. Simple, brutal, efficace.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_win_016",
          "title": "NETTOYAGE MÉTHODIQUE",
          "description": "Les défis ont coupé la clock adverse avant qu'elle devienne dangereuse.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_win_017",
          "title": "VICTOIRE AU CONTACT",
          "description": "Pas une course propre, une lutte au corps à corps. Tu as gagné les duels importants.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_win_018",
          "title": "BOARD À TOI",
          "description": "Une fois le plateau gagné, le score final n'était plus qu'une formalité.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_win_019",
          "title": "DÉFIS DE VALUE",
          "description": "{challengeCount} défis et pas juste du bruit : du tempo converti en victoire.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_win_020",
          "title": "LA TABLE RÉPOND",
          "description": "Le plateau a parlé en premier, le score a confirmé ensuite.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "board_grind_win_021",
          "title": "TU NE PASSERAS PAS",
          "description": "{challengeCount} défis et un board verrouillé. {opponentName} a frappé le mur trop longtemps.",
          "tone": "pop",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_022",
          "title": "IL A ÉTEINT L'INCENDIE",
          "description": "Chaque défi a retiré une menace. Le feu adverse n'a jamais pris la maison.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_023",
          "title": "JE VAIS TOUT CASSER",
          "description": "Le board a été démonté pièce par pièce. {opponentName} a perdu l'atelier.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_024",
          "title": "TRADES RENTABLES",
          "description": "Tu as transformé les défis en value. Le board adverse a payé chaque échange trop cher.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_025",
          "title": "NETTOYAGE AU MÉTIER",
          "description": "Pas de grand discours. Juste des challenges propres et une table plus respirable.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_026",
          "title": "BOARD SOUS CADENAS",
          "description": "Le plateau a été verrouillé avant que la course au lore ne devienne dangereuse.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_027",
          "title": "SANCTION IMMÉDIATE",
          "description": "Chaque personnage exposé a été puni. {opponentName} a appris la géographie du board.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_028",
          "title": "LUNDI MATIN SUR LE PLATEAU",
          "description": "Il y avait foule, puis plus grand-monde. Le nettoyage a fait son travail.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_029",
          "title": "C'EST CHIRURGICAL",
          "description": "Les défis ont coupé juste où il fallait. Aucun échange gratuit pour {opponentName}.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_030",
          "title": "PAS TOUCHE AU BOARD",
          "description": "Tu as gardé le rythme et le terrain. L'adversaire n'a jamais installé sa scène.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_031",
          "title": "LE BREAK PAR LE PLATEAU",
          "description": "Ce n'est pas le lore qui a parlé en premier. C'est la domination du board.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_032",
          "title": "DÉFENSE DE FER",
          "description": "Tu as fait le dos rond, puis rendu chaque défi rentable.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_033",
          "title": "LA TABLE A CHANGÉ DE CAMP",
          "description": "Au fil des échanges, le board est devenu ton adresse officielle.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_034",
          "title": "CLEANUP CREW",
          "description": "L'équipe de nettoyage est passée. Les menaces adverses ont fini en souvenirs.",
          "tone": "gaming",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_035",
          "title": "BOARD WIPE HUMAIN",
          "description": "Pas besoin d'un sort massif. Tes challenges ont fait le ménage eux-mêmes.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_036",
          "title": "L'ORAGE EST PASSÉ",
          "description": "Tu as tenu la pression, puis nettoyé ce qui restait.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_037",
          "title": "BATAILLE GAGNÉE AU SOL",
          "description": "{challengeCount} défis, et chaque mètre du board a été disputé correctement.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_038",
          "title": "ADVERSAIRE EN RECUL",
          "description": "Les trades ont forcé {opponentName} à défendre au lieu de scorer.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_039",
          "title": "VALUE AU CONTACT",
          "description": "Tu n'as pas seulement tapé. Tu as gagné des ressources à chaque échange.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_win_040",
          "title": "PAS DE SURVIVANTS INUTILES",
          "description": "Le board adverse a cherché un refuge. Mauvaise carte, mauvais quartier.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "board_grind_loss",
      "label": "Défaite malgré beaucoup de défis",
      "priority": 70,
      "conditions": {
        "isWin": false,
        "challengeCountMin": 8
      },
      "tags": [
        "loss",
        "board",
        "challenge"
      ],
      "lines": [
        {
          "id": "board_grind_loss_001",
          "title": "ÇA TAPE, MAIS ÇA LORE PAS",
          "description": "{challengeCount} défis, beaucoup de bruit, pas assez de score. Le board n'a pas converti.",
          "tone": "sarcastic",
          "intensity": 3
        },
        {
          "id": "board_grind_loss_002",
          "title": "TRADES PERDANTS",
          "description": "Tu as combattu, mais {opponentName} a mieux transformé ses ressources en lore.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_003",
          "title": "BASTON STÉRILE",
          "description": "Les défis ont ralenti la partie sans vraiment la retourner. Mauvais rendement.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_004",
          "title": "BOARD CONTESTÉ",
          "description": "Tu as passé du temps à nettoyer, mais la clock adverse continuait de tourner.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_005",
          "title": "TROP DE COMBAT",
          "description": "À force de défier, tu as peut-être oublié la course aux 20.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_006",
          "title": "CONTRÔLE INSUFFISANT",
          "description": "Le plateau était disputé, mais pas assez gagné pour ouvrir le lethal.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_007",
          "title": "ARÈNE PERDUE",
          "description": "Les trades n'ont pas donné l'avantage prévu. L'adversaire a gardé le tempo décisif.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_008",
          "title": "TAPER NE SUFFIT PAS",
          "description": "Les défis doivent acheter du temps ou du lore. Ici, ils ont surtout consommé des ressources.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_009",
          "title": "BATAILLE SANS TROPHÉE",
          "description": "Tu as gagné quelques duels, pas la guerre. Le score final est l'arbitre.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_010",
          "title": "PLATEAU TROP CHER",
          "description": "Contester le board a coûté plus que ça n'a rapporté. {opponentName} a pris la course.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_011",
          "title": "DÉFIS EN BOUCLE",
          "description": "Tu as passé trop de tours en mode pompier. Pendant ce temps, le lore adverse montait.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_012",
          "title": "MAUVAISE CONVERSION",
          "description": "Le combat n'a pas assez ralenti l'adversaire. Il fallait transformer ces trades en fenêtre de score.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_013",
          "title": "TRADE TAX",
          "description": "Chaque défi payait une taxe. À la fin, c'est ton plan qui était à découvert.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_014",
          "title": "BOARD NON VERROUILLÉ",
          "description": "Tu as contesté, oui. Mais jamais assez pour reprendre l'initiative.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_loss_015",
          "title": "COURSE OUBLIÉE",
          "description": "Le plateau occupait toute l'attention. Le score, lui, filait en face.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_016",
          "title": "TROP DE RÉPONSES",
          "description": "Répondre sans menacer, c'est survivre. Pas gagner.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_017",
          "title": "USURE DÉFAVORABLE",
          "description": "La partie s'est usée au board, mais l'adversaire avait le meilleur rendement.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_018",
          "title": "COMBAT NON RENTABLE",
          "description": "{challengeCount} défis pour une défaite : le ratio demande une review.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_019",
          "title": "ÉCHANGES TOXIQUES",
          "description": "Tu as accepté trop de trades qui servaient le plan adverse plus que le tien.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "board_grind_loss_020",
          "title": "BOARD QUI FUIT",
          "description": "Même contesté, le plateau n'a jamais vraiment basculé. Et le score a continué.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "board_grind_loss_021",
          "title": "ÇA TAPE, MAIS ÇA LORE PAS",
          "description": "{challengeCount} défis, beaucoup de bruit, pas assez de score. Le board a gagné la mauvaise bataille.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_022",
          "title": "BAGARRE PERDUE",
          "description": "Tu as combattu, mais {opponentName} a mieux converti ses cartes en lore.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_023",
          "title": "LE FEU RESTE OUVERT",
          "description": "Tu as tenté d'éteindre l'incendie. Il restait trop de braises sur le board.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_024",
          "title": "TRADES TROP CHERS",
          "description": "Chaque défi coûtait plus qu'il ne rapportait. La value est partie côté adverse.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_025",
          "title": "BOARD SANS PRIME",
          "description": "Gagner des combats ne suffit pas si le compteur de lore file ailleurs.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_026",
          "title": "JE VAIS TOUT CASSER, PRESQUE",
          "description": "Tu as cassé des choses, mais pas le plan adverse. Mauvaise démolition.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_027",
          "title": "TROP DE CONTACT",
          "description": "À force de défier, tu as oublié que la ligne d'arrivée était à 20 lore.",
          "tone": "sarcastic",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_028",
          "title": "DÉFENSE EN RETARD",
          "description": "Les challenges arrivaient après le problème. {opponentName} avait déjà encaissé le lore.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_029",
          "title": "LE BOARD TE PIÈGE",
          "description": "Tu as répondu au plateau, pas à la clock. La clock a gagné.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_030",
          "title": "BATAILLE MAL PAYÉE",
          "description": "Beaucoup d'efforts, peu de conversion. Le score ne rémunère pas les intentions.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_031",
          "title": "IL FALLAIT CHOISIR",
          "description": "Défier ou quêter : le match a puni les tours où tu n'as pas tranché.",
          "tone": "tactical",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_032",
          "title": "LE PLATEAU A MENTI",
          "description": "Il semblait important, mais la course au lore se jouait ailleurs.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_033",
          "title": "TRANCHÉES INUTILES",
          "description": "{challengeCount} défis dans la boue, mais {opponentName} a gagné sur la route sèche.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_034",
          "title": "MUR TROP TARDIF",
          "description": "La défense s'est montée après l'inondation. Courageux, mais pas rentable.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_035",
          "title": "PAS DE PHOTO AU SCORE",
          "description": "Le board était disputé, mais le résultat a choisi le camp le plus efficace.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_036",
          "title": "NETTOYAGE SANS FIN",
          "description": "Chaque menace retirée en cachait une autre. Le tempo n'a jamais vraiment tourné.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_037",
          "title": "LA VALUE S'ÉCHAPPE",
          "description": "Les échanges ne t'ont pas donné assez de cartes, d'encre ou de lore.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_038",
          "title": "BAGARRE DE TROP",
          "description": "Un défi de plus, une quête de moins. {opponentName} a profité de l'arithmétique.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_039",
          "title": "PAS LE BON COMBAT",
          "description": "Tu as gagné certaines tables du board, mais perdu le match sur l'économie globale.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "board_grind_loss_040",
          "title": "LE SCORE NE MENT PAS",
          "description": "Le plateau pouvait sembler vivant. Le compteur, lui, racontait une autre histoire.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "lore_race_win",
      "label": "Victoire par course au lore",
      "priority": 75,
      "conditions": {
        "isWin": true,
        "questRatioMin": 80
      },
      "tags": [
        "win",
        "quest",
        "lore_race"
      ],
      "lines": [
        {
          "id": "lore_race_win_001",
          "title": "TOUT DROIT AUX 20",
          "description": "{questRatio}% d'actions orientées quête. Tu as choisi la ligne droite, et elle a tenu.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_win_002",
          "title": "COURSE VALIDÉE",
          "description": "Peu de détours, beaucoup de lore. {opponentName} n'a jamais rattrapé la clock.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_win_003",
          "title": "SPRINT AU LORE",
          "description": "Tu as assumé la race et fermé avant que les trades deviennent obligatoires.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_win_004",
          "title": "LA LIGNE DROITE",
          "description": "Le plan était clair : marquer plus vite que l'autre ne répond. Mission réussie.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_005",
          "title": "CLOCK PERMANENTE",
          "description": "Chaque quête mettait une pression simple et lisible. Le score a suivi.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_006",
          "title": "QUEST EXPRESS",
          "description": "Tu as laissé le board parler moins que le compteur de lore. Ça a suffi.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_win_007",
          "title": "PLAN ASSUMÉ",
          "description": "Quand on choisit la race, il faut la gagner. Cette fois, la vitesse était à toi.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_win_008",
          "title": "LORE AVANT TOUT",
          "description": "Les défis attendront. Tu as mis les points d'abord, et {opponentName} a couru derrière.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_win_009",
          "title": "TEMPO DE SCORE",
          "description": "Tu as transformé le board en compteur. Chaque tour demandait une réponse immédiate.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_win_010",
          "title": "PAS DE FREIN",
          "description": "Le score a avancé plus vite que les solutions adverses. Rien à ajouter.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "lore_race_win_011",
          "title": "COURSE GAGNÉE",
          "description": "Tu as gagné la partie à la clock. Pas forcément au board, mais aux règles du jeu.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_012",
          "title": "QUÊTE RENTABLE",
          "description": "Chaque aventure a ajouté une vraie pression. Le plan a tenu jusqu'au lethal.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_013",
          "title": "VITESSE PROPRE",
          "description": "Tu n'as pas confondu agressivité et désordre. La race au lore était bien pilotée.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_014",
          "title": "DROIT AU BUT",
          "description": "À ce niveau de quête, le message est simple : le score d'abord, les débats après.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_win_015",
          "title": "CLOCK ÉTOUFFANTE",
          "description": "{opponentName} a dû répondre au score avant de développer son propre plan.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_win_016",
          "title": "OBJECTIF 20",
          "description": "La partie n'était pas de tout contrôler. Elle était d'arriver d'abord. C'est fait.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_017",
          "title": "LORE EN RAFALE",
          "description": "Les points sont tombés assez vite pour rendre les réponses adverses trop lentes.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_win_018",
          "title": "RUN PROPRE",
          "description": "Une bonne course au lore, c'est une discipline. Tu as évité les détours inutiles.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_win_019",
          "title": "PAS DE TOURISME",
          "description": "Tu es venu pour les 20, pas pour visiter le board. Victoire efficace.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "lore_race_win_020",
          "title": "COMPTEUR SOUS PRESSION",
          "description": "Le score adverse n'avait pas le temps de respirer. La clock a fait le travail.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_win_021",
          "title": "TOUT DROIT AU BUT",
          "description": "{questRatio}% orienté quête. Tu as vu la ligne, puis tu as sprinté.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_022",
          "title": "COURSE VALIDÉE",
          "description": "Peu de détours, beaucoup de lore. {opponentName} n'a jamais rattrapé la clock.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_023",
          "title": "JE SUIS LA VITESSE",
          "description": "La stratégie était simple : quêter, accélérer, conclure. Et ça a suffi.",
          "tone": "disney_hint",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_024",
          "title": "SECOND POTEAU LORE",
          "description": "{topQuester} a mis les points au bon endroit. Le score a suivi.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_025",
          "title": "LETHAL EN LIGNE DROITE",
          "description": "Pas besoin de contrôler tout le board quand la ligne d'arrivée est ouverte.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_026",
          "title": "LA CLOCK EST À TOI",
          "description": "Tu as imposé le tempo du compteur. {opponentName} répondait à la mauvaise question.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_027",
          "title": "PAS DE DÉTOUR",
          "description": "La meilleure route vers 20 était devant toi. Tu l'as prise sans GPS inutile.",
          "tone": "sarcastic",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_028",
          "title": "LORE AVANT TOUT",
          "description": "Chaque tour a posé la même question. {opponentName} n'avait pas assez de réponses.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_029",
          "title": "LA PHOTO-FINISH ÉVITÉE",
          "description": "Tu as creusé assez tôt pour ne pas laisser la fin devenir un casino.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_030",
          "title": "CAVIAR DE QUÊTES",
          "description": "Le board a servi la course. {topQuester} a converti sans trembler.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_031",
          "title": "VERS LES 20",
          "description": "Le score a décollé proprement. Pas besoin de détourner l'avion.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_032",
          "title": "LE STADE A SUIVI",
          "description": "Quand le compteur monte aussi vite, même les trades deviennent secondaires.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_033",
          "title": "COURSE AU LORE GAGNÉE",
          "description": "Tu as accepté le sprint et gagné sur la cadence, pas sur le spectacle.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_034",
          "title": "TOUJOURS DEVANT",
          "description": "{opponentName} n'a pas trouvé le frein. Ta clock dictait le rythme.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_035",
          "title": "LA LIGNE EST FRANCHIE",
          "description": "Course maîtrisée. Les quêtes ont fait plus que les combats.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_036",
          "title": "L'AVENTURE EST LÀ-BAS",
          "description": "Et tu y es allé sans hésiter. Le lore était la seule destination.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_037",
          "title": "PAS DE VAR, PAS DE DOUTE",
          "description": "Le compteur a monté, tour après tour. La victoire est entrée sans débat.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_038",
          "title": "QUÊTES EN RAFALE",
          "description": "{questCount} quêtes cumulées, et assez de pression pour fermer le match.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_039",
          "title": "LE PLAN LE PLUS COURT",
          "description": "Parfois, la meilleure réponse au board adverse, c'est juste de finir avant lui.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_win_040",
          "title": "LÉTHAL AU COMPTEUR",
          "description": "Tu as joué la clock comme une ressource. {opponentName} l'a compris trop tard.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "lore_race_loss",
      "label": "Défaite en course au lore",
      "priority": 74,
      "conditions": {
        "isWin": false,
        "questRatioMin": 80
      },
      "tags": [
        "loss",
        "quest",
        "lore_race"
      ],
      "lines": [
        {
          "id": "lore_race_loss_001",
          "title": "SPRINT PERDU",
          "description": "Tu as couru vers les 20, mais {opponentName} avait une meilleure clock.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_002",
          "title": "COURSE MAL PAYÉE",
          "description": "{questRatio}% de quête, mais pas assez vite. La ligne droite ne pardonne pas.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_003",
          "title": "TROP DROIT DEVANT",
          "description": "Tu as ignoré le board pour courir. L'adversaire a couru mieux.",
          "tone": "sarcastic",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_004",
          "title": "LA CLOCK ADVERSE",
          "description": "Le plan lore était clair, mais le chrono d'en face était plus précis.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_005",
          "title": "RACE PERDUE",
          "description": "Quand on choisit la course, il faut finir premier. Cette fois, il manquait un tour.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_006",
          "title": "PAS ASSEZ VITE",
          "description": "Tu as marqué, oui. Mais {opponentName} a fermé avant que ton plan atteigne les 20.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_007",
          "title": "COURSE SANS FREIN",
          "description": "Tu as sprinté sans assez contrôler les menaces adverses. Le retour était impossible.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_008",
          "title": "QUEST RISQUÉE",
          "description": "Beaucoup de lore, pas assez de sécurité. L'adversaire a puni l'ouverture.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_009",
          "title": "SPRINT SOUS PLUIE",
          "description": "La ligne était bonne, mais les appuis ont glissé au mauvais moment.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_010",
          "title": "LE SCORE NE SUFFIT PAS",
          "description": "Marquer vite aide. Empêcher l'autre de marquer plus vite aide encore plus.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_011",
          "title": "BOARD NÉGLIGÉ",
          "description": "La course au lore a laissé trop d'espace. {opponentName} a transformé cet espace en lethal.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_012",
          "title": "PLAN TROP PUR",
          "description": "La ligne droite était élégante, mais le match demandait peut-être un détour par les défis.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_loss_013",
          "title": "DERNIER MÈTRE RATÉ",
          "description": "Tu étais lancé, mais pas assez proche du finish. Le score adverse a claqué avant.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_014",
          "title": "CLOCK INSUFFISANTE",
          "description": "Le plan n'était pas absurde. Il était juste un tour trop lent.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_loss_015",
          "title": "TROP DE QUÊTE",
          "description": "À force de chercher le lore, tu as peut-être laissé passer le board critique.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_016",
          "title": "DUEL DE VITESSE PERDU",
          "description": "{opponentName} avait la meilleure sortie pour ce type de course. Difficile à rattraper.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_loss_017",
          "title": "CHASSE AUX 20 RATÉE",
          "description": "Tu as couru dans le bon sens, mais pas assez vite pour éviter le lethal adverse.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_018",
          "title": "SCORE PIÉGÉ",
          "description": "La pression au lore était réelle, mais elle n'a pas cassé le plan adverse.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "lore_race_loss_019",
          "title": "LA PHOTO EST FLOUE",
          "description": "Tu n'étais pas loin, mais la ligne d'arrivée n'attend personne.",
          "tone": "sport",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_020",
          "title": "COURSE SANS TROPHÉE",
          "description": "Beaucoup de points, zéro victoire. Le replay doit dire où la clock s'est perdue.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "lore_race_loss_021",
          "title": "SPRINT PERDU",
          "description": "{questRatio}% orienté quête, mais {opponentName} avait une meilleure clock.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_022",
          "title": "COURSE MAL PAYÉE",
          "description": "Tu as couru vers les 20, mais pas assez vite pour sortir du trafic.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_023",
          "title": "IL N'A PAS TREMBLÉ",
          "description": "Malheureusement, c'est {opponentName} qui a conclu au bon moment.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_024",
          "title": "PHOTO-FINISH RATÉ",
          "description": "La ligne était visible. Elle était juste un tour trop loin.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_025",
          "title": "LETHAL EN FACE",
          "description": "Tu regardais le compteur, {opponentName} regardait la victoire.",
          "tone": "tcg",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_026",
          "title": "PAS ASSEZ DE LORE",
          "description": "La ligne droite ne pardonne pas. Quelques points manquants coûtent tout le match.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_027",
          "title": "LA CLOCK T'A DOUBLÉ",
          "description": "Tu as sprinté, mais {opponentName} avait une foulée d'avance.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_028",
          "title": "SECOND POTEAU ADVERSE",
          "description": "La carte décisive n'est pas venue de ton côté. Le stade a changé de couleur.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_029",
          "title": "SI PROCHE",
          "description": "À ce niveau, presque finir, c'est surtout perdre avec vue sur la ligne.",
          "tone": "sarcastic",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_030",
          "title": "LE SCORE A FUI",
          "description": "Tu as choisi la course, mais l'écart n'a jamais vraiment fermé.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_031",
          "title": "MALHEUREUSEMENT PAS KACHOW",
          "description": "Le moteur était lancé, mais pas assez vite pour passer devant.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_032",
          "title": "LA DERNIÈRE QUÊTE MANQUE",
          "description": "Il fallait un tour de plus. Le match n'avait pas prévu les prolongations.",
          "tone": "tcg",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_033",
          "title": "LE COMPTEUR EN RETARD",
          "description": "{questCount} quêtes, mais une cadence insuffisante. La clock adverse a gagné.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_034",
          "title": "LA LIGNE S'ÉLOIGNE",
          "description": "Chaque tour semblait rapprocher les 20, mais {opponentName} y arrivait plus vite.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_035",
          "title": "COURSE SANS DÉFENSE",
          "description": "À force de courir, tu as laissé trop d'espace au compteur adverse.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_036",
          "title": "PAS DE HOLD-UP",
          "description": "Tu as tenté la ligne droite. Cette fois, personne n'a ouvert la porte arrière.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_037",
          "title": "LA CLIM DU COMPTEUR",
          "description": "Tu étais dans la course, puis le dernier lore adverse a coupé le chauffage.",
          "tone": "sport",
          "intensity": 3,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_038",
          "title": "UN VIRAGE DE TROP",
          "description": "La trajectoire était ambitieuse, mais la fin de course a manqué de grip.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_039",
          "title": "DESTINATION MANQUÉE",
          "description": "L'aventure était là-bas, mais le score adverse est arrivé avant.",
          "tone": "disney_hint",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "lore_race_loss_040",
          "title": "COMPTEUR CRUEL",
          "description": "La stratégie était lisible, mais pas assez rapide. Le lore n'a pas de compassion.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    },
    {
      "id": "default_loss",
      "label": "Défaite standard",
      "priority": 55,
      "conditions": {
        "isWin": false
      },
      "tags": [
        "loss",
        "default"
      ],
      "lines": [
        {
          "id": "default_loss_001",
          "title": "RÉVEIL DOULOUREUX",
          "description": "Défaite {monScore}-{scoreAdverse}. Le replay dira si le problème vient du mulligan, de la curve ou des trades.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_002",
          "title": "TEMPO PERDU",
          "description": "Le plan a coincé assez tôt pour laisser {opponentName} jouer devant.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_003",
          "title": "RETOUR À L'ENTRAÎNEMENT",
          "description": "Pas une catastrophe absolue, mais assez de signaux pour mériter une review froide.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_004",
          "title": "PLAN ENRAYÉ",
          "description": "Le deck a tenté de tourner, mais la pression n'a jamais vraiment converti.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_005",
          "title": "DÉFAITE TACTIQUE",
          "description": "Le score reflète un manque de conversion : ressources, board ou lore, quelque chose a fui.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_006",
          "title": "PAS ASSEZ D'IMPACT",
          "description": "Tu as joué des cartes, mais pas assez de menaces qui changent la partie.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_007",
          "title": "PARTIE SUBIE",
          "description": "{opponentName} a imposé le rythme. Tu as trop souvent répondu au lieu de piloter.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_008",
          "title": "MAUVAIS TEMPO",
          "description": "La partie ne s'est pas effondrée d'un coup. Elle a glissé tour après tour.",
          "tone": "sport",
          "intensity": 1
        },
        {
          "id": "default_loss_009",
          "title": "VALUE INSUFFISANTE",
          "description": "Chaque échange a semblé un peu trop cher. À la fin, l'écart s'accumule.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_010",
          "title": "LE PLAN MANQUE",
          "description": "On voit des actions, mais pas assez de ligne directrice jusqu'au lethal.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_011",
          "title": "SCORE LOGIQUE",
          "description": "La dynamique était défavorable et le final ne fait que confirmer la tendance.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_012",
          "title": "TROP PEU DE MENACE",
          "description": "Sans pression durable, l'adversaire a pu choisir son rythme.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_013",
          "title": "FENÊTRES RATÉES",
          "description": "Il y avait peut-être des ouvertures. Elles n'ont pas été converties à temps.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_014",
          "title": "DÉFAITE UTILE",
          "description": "Pas agréable, mais exploitable. La VOD devrait sortir au moins une correction claire.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_015",
          "title": "PAS ASSEZ PROPRE",
          "description": "Le match demandait une ligne plus nette. Trop de tours ont manqué d'impact.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_016",
          "title": "LECTURE ADVERSE",
          "description": "{opponentName} a mieux compris quand accélérer et quand ralentir.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_017",
          "title": "COURSE PERDUE",
          "description": "Tu as marqué, mais pas assez régulièrement pour menacer la fin de partie.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_018",
          "title": "BOARD FRAGILE",
          "description": "Le plateau n'a pas tenu assez longtemps pour produire une vraie pression.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_019",
          "title": "RESSOURCES MOLLES",
          "description": "Les ressources existaient, mais elles n'ont pas assez transformé la partie.",
          "tone": "tactical",
          "intensity": 2
        },
        {
          "id": "default_loss_020",
          "title": "À REVOIR",
          "description": "Ce n'est pas un drame. C'est une liste de micro-décisions à nettoyer.",
          "tone": "tactical",
          "intensity": 1
        },
        {
          "id": "default_loss_021",
          "title": "RÉVEIL DOULOUREUX",
          "description": "Défaite {monScore}-{scoreAdverse}. Le replay dira si le crime vient du mulligan, de la curve ou des trades.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_022",
          "title": "LE TEMPO PERDU",
          "description": "La partie n'a pas explosé d'un coup. Elle s'est éloignée tour après tour.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_023",
          "title": "ON APPREND DU PASSÉ",
          "description": "Rafiki avait raison : ça pique, mais cette VOD peut servir.",
          "tone": "disney_hint",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_024",
          "title": "SOIRÉE À OUBLIER",
          "description": "Pas la plus belle page du deck. Mais les stats ont gardé les passages importants.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_025",
          "title": "C'EST PAS FAUX",
          "description": "Dire que le plan a coincé est poli. Dire où il a coincé sera plus utile.",
          "tone": "pop_fr",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_026",
          "title": "PLAN EN CHANTIER",
          "description": "Il y avait des idées, mais elles ne se sont pas assez connectées au board.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_027",
          "title": "PAS DE DRAME, DES DONNÉES",
          "description": "La défaite est là. Le vrai intérêt, c'est ce que le replay révèle.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_028",
          "title": "LE BOARD A CHOISI",
          "description": "{opponentName} a mieux transformé ses ressources. Pas forcément plus flashy, juste plus rentable.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_029",
          "title": "MATCH À DISSÉQUER",
          "description": "Le score fait mal, mais il contient sûrement une erreur répétable à corriger.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_030",
          "title": "LA CURVE QUESTIONNE",
          "description": "La partie a manqué de fluidité. Le replay devrait montrer où le tempo s'est cassé.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_031",
          "title": "PETIT PASSAGE À VIDE",
          "description": "Pas une catastrophe culturelle, mais assez de retard pour laisser filer {opponentName}.",
          "tone": "sarcastic",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_032",
          "title": "TROP DE FENÊTRES",
          "description": "Tu as laissé des ouvertures, {opponentName} les a prises sans enlever ses chaussures.",
          "tone": "sport",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_033",
          "title": "MATCH SOUS ANALYSE",
          "description": "La défaite n'est pas forcément un naufrage. Mais elle mérite un contrôle technique.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_034",
          "title": "LA VALUE EN FACE",
          "description": "{opponentName} a mieux rentabilisé ses cartes clés. Le reste est une conséquence.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_035",
          "title": "PAS LE BON FILM",
          "description": "Le scénario prévu n'est pas sorti. Le replay montre le montage réel.",
          "tone": "cinematic",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_036",
          "title": "UN TOUR DE TROP",
          "description": "La partie est restée jouable assez longtemps pour devenir frustrante.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_037",
          "title": "LA PORTE EST RESTÉE OUVERTE",
          "description": "Une fenêtre adverse a suffi. À ce niveau, même une petite ouverture coûte cher.",
          "tone": "tactical",
          "intensity": 2,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_038",
          "title": "RETOUR À L'ENTRAÎNEMENT",
          "description": "Pas pour punir, pour comprendre. La prochaine game commence dans ce replay.",
          "tone": "sport",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_039",
          "title": "LE MATCH A PARLÉ",
          "description": "Il n'a pas crié, mais il a montré un retard de tempo assez net.",
          "tone": "tactical",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        },
        {
          "id": "default_loss_040",
          "title": "PAS DE FIN DISNEY",
          "description": "Cette fois, le dernier chapitre appartient à {opponentName}. On corrige le scénario.",
          "tone": "disney_hint",
          "intensity": 1,
          "tags": [
            "cultural_pack"
          ]
        }
      ]
    }
  ]
};
