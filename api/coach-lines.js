export const COACH_LINE_LIBRARY = {
  "version": "coach-lines-v126",
  "description": "Bibliothèque déterministe de punchlines courtes pour InkSight. Les textes visent la situation de jeu, pas le joueur.",
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
        }
      ]
    }
  ]
};
