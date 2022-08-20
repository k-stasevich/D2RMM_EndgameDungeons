const newLevels = [];

(function () {
  patchLevels();
  patchLvlMaze();
  patchCubeMain();
  // patchLvlPrest();
  // patchLvlWarp()
  patchLevelsStrings();
  // overrideCombinedDs1();
})();

function patchLevels() {
  const filePath = "global\\excel\\levels.txt";
  const file = D2RMM.readTsv(filePath);

  let levelId = file.rows.length - 1;

  function addLevel(levelNumber, lvlNameToClone, overrides) {
    const isFirstLevel = !newLevels.length;
    const levelToClone = file.rows.find((r) => r.Name === lvlNameToClone);
    const prevLevel = newLevels[newLevels.length - 1];
    let lvl = { ...levelToClone };

    lvl.Id = levelId++;
    lvl.Name = `Endgame Dungeon ${levelNumber}`;
    lvl["*StringName"] = `Endgame Dungeon ${levelNumber}`;
    // TODO: change texts for enter/exit
    lvl.Pal = 4;
    lvl.Act = 4;

    if (overrides) lvl = { ...lvl, ...overrides };

    for (let i = 0; i < 8; i++) {
      lvl[`Vis${i}`] = "0";
      lvl[`Warp${i}`] = "-1";
    }

    /**
     * Setting exit location to cold plains because whatever we cloned for our
     * first level of dungeon - exit should lead to 'Cold PLains' where our entry is
     */
    if (isFirstLevel) {
      // lvl.Vis0 = COLD_PLAINS_LVL_ID;
    } else {
      // If it's second or further level we set Vis0 to a prev level
      // lvl.Vis0 = prevLevel.lvl.Id;
      if (!overrides.Warp0) throw new Error("Must set Warp0 for Vis0");
    }

    newLevels.push({ lvl, meta: { originalLevel: levelToClone } });

    return lvl;
  }

  // lvl1
  const lvl1 = addLevel(1, "Act 1 - Cave 2");

  file.rows.push(...newLevels.map((i) => i.lvl));

  D2RMM.writeTsv(filePath, file);
}

function patchLvlMaze() {
  const filePath = "global\\excel\\lvlmaze.txt";
  const file = D2RMM.readTsv(filePath);

  newLevels.forEach((level) => {
    const lineToClone = file.rows.find(
      (r) => r.Level === level.meta.originalLevel.Id
    );
    file.rows.push({
      ...lineToClone,
      Level: level.lvl.Id,
      Name: level.lvl.Name,
    });
  });

  D2RMM.writeTsv(filePath, file);
}

// eslint-disable-next-line
function patchLvlPrest() {
  const filePath = "global\\excel\\lvlprest.txt";
  const file = D2RMM.readTsv(filePath);
  D2RMM.writeTsv(filePath, file);
}

// eslint-disable-next-line
function patchLvlWarp() {
  const filePath = "global\\excel\\lvlwarp.txt";
  const file = D2RMM.readTsv(filePath);
  D2RMM.writeTsv(filePath, file);
}

function patchCubeMain() {
  const filePath = "global\\excel\\cubemain.txt";
  const file = D2RMM.readTsv(filePath);

  file.rows.push({
    enabled: "1",
    version: "100",
    numinputs: "1",
    ["input 1"]: "tsc",
    output: `Red Portal,qty=${newLevels[0].lvl.Id}`,
  });

  D2RMM.writeTsv(filePath, file);
}

function patchLevelsStrings() {
  const filePath = "local\\lng\\strings\\levels.json";
  const file = D2RMM.readJson(filePath);

  const getLangs = (row) => {
    let langs = [];
    for (const prop in row) {
      if (prop === "id" || prop === "Key") continue;
      langs.push(prop);
    }
    return langs;
  };

  const lastRow = file[file.length - 1];
  let id = lastRow.id;
  let langs = getLangs(lastRow);

  newLevels.forEach((level) => {
    const newRow = { ...lastRow };

    newRow.id = id.toString();
    ++id;
    newRow.Key = level.lvl.Name;
    langs.forEach((lang) => (newRow[lang] = level.lvl.Name));

    file.push(newRow);
  });

  D2RMM.writeJson(filePath, file);
}

function overrideCombinedDs1() {
  // TODO: mb need to use D2RMM.copyFile for it
  // Rewrite combined_ds1 to not take map from the cache but take our changes
  const filePath = "global\\tiles\\expansion\\combined_ds1.bin";
  const file = D2RMM.readTsv(filePath);
  D2RMM.writeTsv(filePath, file);
}
