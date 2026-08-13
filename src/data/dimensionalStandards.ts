export interface FlangeDimensions {
  size: string;
  od: string;
  pcd: string;
  thk: string;
  id?: string;
  hubLarge?: string;
  hubSmall?: string;
  hubLength?: string;
  rf?: string;
  schedules?: Record<string, string>;
}

export const FLANGE_STANDARDS_75_B: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "762.0", pcd: "717.5", thk: "35.1", id: "665.2", hubLarge: "682.6", hubSmall: "660.4", hubLength: "46.1", rf: "704.9" },
    WNRF: { size: "26\"", od: "762.0", pcd: "717.5", thk: "35.1", id: "660.4", hubLarge: "682.6", hubSmall: "660.4", hubLength: "87.3", rf: "704.9" },
    BLRF: { size: "26\"", od: "762.0", pcd: "717.5", thk: "35.1", rf: "704.9" }
  }
};

export const FLANGE_STANDARDS_150: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "1/2\"": { 
    SORF: { size: "1/2\"", od: "88.9", pcd: "60.3", thk: "11.1", id: "22.4", hubLarge: "30.2", hubSmall: "21.3", hubLength: "15.9", rf: "35.1" },
    WNRF: { size: "1/2\"", od: "88.9", pcd: "60.3", thk: "11.1", id: "15.8", hubLarge: "30.2", hubSmall: "21.3", hubLength: "47.6", rf: "35.1", schedules: { "SCH 5": "18.9", "SCH 10": "17.1", "SCH 40 (STD)": "15.8", "SCH 80 (XS)": "13.9", "SCH 160": "11.8", "SCH XXS": "6.4" } },
    BLRF: { size: "1/2\"", od: "88.9", pcd: "60.3", thk: "11.1", rf: "35.1" }
  },
  "3/4\"": { 
    SORF: { size: "3/4\"", od: "98.4", pcd: "69.8", thk: "12.7", id: "27.7", hubLarge: "38.1", hubSmall: "26.7", hubLength: "15.9", rf: "42.9" },
    WNRF: { size: "3/4\"", od: "98.4", pcd: "69.8", thk: "12.7", id: "20.9", hubLarge: "38.1", hubSmall: "26.7", hubLength: "52.4", rf: "42.9", schedules: { "SCH 5": "24.3", "SCH 10": "22.5", "SCH 40 (STD)": "20.9", "SCH 80 (XS)": "18.9", "SCH 160": "15.6", "SCH XXS": "11.0" } },
    BLRF: { size: "3/4\"", od: "98.4", pcd: "69.8", thk: "12.7", rf: "42.9" }
  },
  "1\"": { 
    SORF: { size: "1\"", od: "108.0", pcd: "79.4", thk: "14.3", id: "34.5", hubLarge: "49.2", hubSmall: "33.4", hubLength: "17.5", rf: "50.8" },
    WNRF: { size: "1\"", od: "108.0", pcd: "79.4", thk: "14.3", id: "26.7", hubLarge: "49.2", hubSmall: "33.4", hubLength: "55.6", rf: "50.8", schedules: { "SCH 5": "31.0", "SCH 10": "29.3", "SCH 40 (STD)": "26.7", "SCH 80 (XS)": "24.3", "SCH 160": "20.7", "SCH XXS": "15.2" } },
    BLRF: { size: "1\"", od: "108.0", pcd: "79.4", thk: "14.3", rf: "50.8" }
  },
  "1 1/4\"": { 
    SORF: { size: "1 1/4\"", od: "117.5", pcd: "88.9", thk: "15.9", id: "43.2", hubLarge: "57.2", hubSmall: "42.2", hubLength: "20.6", rf: "63.5" },
    WNRF: { size: "1 1/4\"", od: "117.5", pcd: "88.9", thk: "15.9", id: "35.1", hubLarge: "57.2", hubSmall: "42.2", hubLength: "55.6", rf: "63.5", schedules: { "SCH 40 (STD)": "35.1", "SCH 80 (XS)": "32.5", "SCH 160": "29.5" } },
    BLRF: { size: "1 1/4\"", od: "117.5", pcd: "88.9", thk: "15.9", rf: "63.5" }
  },
  "1 1/2\"": { 
    SORF: { size: "1 1/2\"", od: "127.0", pcd: "98.4", thk: "17.5", id: "49.5", hubLarge: "65.1", hubSmall: "65.1", hubLength: "22.2", rf: "73.0" },
    WNRF: { size: "1 1/2\"", od: "127.0", pcd: "98.4", thk: "17.5", id: "40.9", hubLarge: "65.1", hubSmall: "48.3", hubLength: "61.9", rf: "73.0", schedules: { "SCH 40 (STD)": "40.9", "SCH 80 (XS)": "38.1", "SCH 160": "34.0", "SCH XXS": "27.9" } },
    BLRF: { size: "1 1/2\"", od: "127.0", pcd: "98.4", thk: "17.5", rf: "73.0" }
  },
  "2\"": { 
    SORF: { size: "2\"", od: "152.4", pcd: "120.6", thk: "19.1", id: "62.0", hubLarge: "77.8", hubSmall: "77.8", hubLength: "25.4", rf: "92.1" },
    WNRF: { size: "2\"", od: "152.4", pcd: "120.6", thk: "19.1", id: "52.5", hubLarge: "77.8", hubSmall: "60.3", hubLength: "63.5", rf: "92.1", schedules: { "SCH 40 (STD)": "52.5", "SCH 80 (XS)": "49.3", "SCH 160": "42.8", "SCH XXS": "38.2" } },
    BLRF: { size: "2\"", od: "152.4", pcd: "120.6", thk: "19.1", rf: "92.1" }
  },
  "2 1/2\"": { 
    SORF: { size: "2 1/2\"", od: "177.8", pcd: "139.7", thk: "22.2", id: "74.7", hubLarge: "90.5", hubSmall: "73.0", hubLength: "28.6", rf: "104.8" },
    WNRF: { size: "2 1/2\"", od: "177.8", pcd: "139.7", thk: "22.2", id: "62.7", hubLarge: "90.5", hubSmall: "73.0", hubLength: "69.9", rf: "104.8", schedules: { "SCH 40 (STD)": "62.7", "SCH 80 (XS)": "59.0", "SCH 160": "54.0" } },
    BLRF: { size: "2 1/2\"", od: "177.8", pcd: "139.7", thk: "22.2", rf: "104.8" }
  },
  "3\"": { 
    SORF: { size: "3\"", od: "190.5", pcd: "152.4", thk: "23.8", id: "90.7", hubLarge: "107.9", hubSmall: "107.9", hubLength: "30.2", rf: "127.0" },
    WNRF: { size: "3\"", od: "190.5", pcd: "152.4", thk: "23.8", id: "77.9", hubLarge: "107.9", hubSmall: "88.9", hubLength: "69.9", rf: "127.0", schedules: { "SCH 40 (STD)": "77.9", "SCH 80 (XS)": "73.7", "SCH 160": "66.6", "SCH XXS": "58.4" } },
    BLRF: { size: "3\"", od: "190.5", pcd: "152.4", thk: "23.8", rf: "127.0" }
  },
  "3 1/2\"": { 
    SORF: { size: "3 1/2\"", od: "215.9", pcd: "177.8", thk: "23.8", id: "103.1", hubLarge: "122.2", hubSmall: "101.6", hubLength: "31.8", rf: "139.7" },
    WNRF: { size: "3 1/2\"", od: "215.9", pcd: "177.8", thk: "23.8", id: "90.1", hubLarge: "122.2", hubSmall: "101.6", hubLength: "71.4", rf: "139.7" },
    BLRF: { size: "3 1/2\"", od: "215.9", pcd: "177.8", thk: "23.8", rf: "139.7" }
  },
  "4\"": { 
    SORF: { size: "4\"", od: "228.6", pcd: "190.5", thk: "23.8", id: "116.1", hubLarge: "134.9", hubSmall: "134.9", hubLength: "33.3", rf: "157.2" },
    WNRF: { size: "4\"", od: "228.6", pcd: "190.5", thk: "23.8", id: "102.3", hubLarge: "134.9", hubSmall: "114.3", hubLength: "76.2", rf: "157.2", schedules: { "SCH 40 (STD)": "102.3", "SCH 80 (XS)": "97.2", "SCH 120": "92.0", "SCH 160": "87.3", "SCH XXS": "80.1" } },
    BLRF: { size: "4\"", od: "228.6", pcd: "190.5", thk: "23.8", rf: "157.2" }
  },
  "6\"": { 
    SORF: { size: "6\"", od: "279.4", pcd: "241.3", thk: "25.4", id: "170.7", hubLarge: "192.1", hubSmall: "192.1", hubLength: "39.7", rf: "215.9" },
    WNRF: { size: "6\"", od: "279.4", pcd: "241.3", thk: "25.4", id: "154.1", hubLarge: "192.1", hubSmall: "168.3", hubLength: "88.9", rf: "215.9", schedules: { "SCH 40 (STD)": "154.1", "SCH 80 (XS)": "146.3", "SCH 120": "139.7", "SCH 160": "131.8", "SCH XXS": "124.4" } },
    BLRF: { size: "6\"", od: "279.4", pcd: "241.3", thk: "25.4", rf: "215.9" }
  },
  "8\"": { 
    SORF: { size: "8\"", od: "342.9", pcd: "298.4", thk: "28.6", id: "221.5", hubLarge: "246.1", hubSmall: "246.1", hubLength: "44.4", rf: "269.9" },
    WNRF: { size: "8\"", od: "342.9", pcd: "298.4", thk: "28.6", id: "202.7", hubLarge: "246.1", hubSmall: "219.1", hubLength: "101.6", rf: "269.9", schedules: { "SCH 20": "206.4", "SCH 30": "205.0", "SCH 40 (STD)": "202.7", "SCH 60": "198.5", "SCH 80 (XS)": "193.7", "SCH 100": "188.9", "SCH 120": "182.5", "SCH 140": "177.8", "SCH 160": "173.1", "SCH XXS": "174.6" } },
    BLRF: { size: "8\"", od: "342.9", pcd: "298.4", thk: "28.6", rf: "269.9" }
  },
  "10\"": { 
    SORF: { size: "10\"", od: "406.4", pcd: "361.9", thk: "30.2", id: "276.3", hubLarge: "304.8", hubSmall: "304.8", hubLength: "49.2", rf: "323.8" },
    WNRF: { size: "10\"", od: "406.4", pcd: "361.9", thk: "30.2", id: "254.5", hubLarge: "304.8", hubSmall: "273.0", hubLength: "101.6", rf: "323.8", schedules: { "SCH 20": "260.4", "SCH 30": "257.5", "SCH 40 (STD)": "254.5", "SCH 60": "247.7", "SCH 80 (XS)": "242.9", "SCH 100": "236.6", "SCH 120": "230.2", "SCH 140": "222.3", "SCH 160": "215.9", "SCH XXS": "222.3" } },
    BLRF: { size: "10\"", od: "406.4", pcd: "361.9", thk: "30.2", rf: "323.8" }
  },
  "12\"": { 
    SORF: { size: "12\"", od: "482.6", pcd: "431.8", thk: "31.7", id: "327.1", hubLarge: "365.1", hubSmall: "365.1", hubLength: "55.6", rf: "381.0" },
    WNRF: { size: "12\"", od: "482.6", pcd: "431.8", thk: "31.7", id: "304.8", hubLarge: "365.1", hubSmall: "323.8", hubLength: "114.3", rf: "381.0", schedules: { "SCH 20": "311.2", "SCH 30": "307.1", "SCH 40 (STD)": "304.8", "SCH 60": "295.4", "SCH 80 (XS)": "288.9", "SCH 100": "281.0", "SCH 120": "273.1", "SCH 140": "266.7", "SCH 160": "257.2", "SCH XXS": "273.1" } },
    BLRF: { size: "12\"", od: "482.6", pcd: "431.8", thk: "31.7", rf: "381.0" }
  },
  "14\"": {
    SORF: { size: "14\"", od: "533.4", pcd: "476.2", thk: "35.0", id: "359.2", hubLarge: "400.0", hubSmall: "355.6", hubLength: "57.2", rf: "412.8" },
    WNRF: { size: "14\"", od: "533.4", pcd: "476.2", thk: "35.0", id: "336.6", hubLarge: "400.0", hubSmall: "355.6", hubLength: "127.0", rf: "412.8", schedules: { "SCH 40 (STD)": "336.6", "SCH 80 (XS)": "325.4" } },
    BLRF: { size: "14\"", od: "533.4", pcd: "476.2", thk: "35.0", rf: "412.8" }
  },
  "16\"": {
    SORF: { size: "16\"", od: "596.9", pcd: "539.8", thk: "36.6", id: "410.5", hubLarge: "457.2", hubSmall: "406.4", hubLength: "63.5", rf: "469.9" },
    WNRF: { size: "16\"", od: "596.9", pcd: "539.8", thk: "36.6", id: "387.4", hubLarge: "457.2", hubSmall: "406.4", hubLength: "127.0", rf: "469.9", schedules: { "SCH 40 (STD)": "387.4", "SCH 80 (XS)": "373.1" } },
    BLRF: { size: "16\"", od: "596.9", pcd: "539.8", thk: "36.6", rf: "469.9" }
  }
};

export const FLANGE_STANDARDS_150_A: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "870.0", pcd: "806.4", thk: "68.3", id: "665.2", hubLarge: "711.2", hubSmall: "660.4", hubLength: "85.8", rf: "749.3" },
    WNRF: { size: "26\"", od: "870.0", pcd: "806.4", thk: "68.3", id: "660.4", hubLarge: "711.2", hubSmall: "660.4", hubLength: "120.6", rf: "749.3" },
    BLRF: { size: "26\"", od: "870.0", pcd: "806.4", thk: "68.3", rf: "749.3" }
  },
  "30\"": {
    SORF: { size: "30\"", od: "984.2", pcd: "914.4", thk: "74.6", id: "766.8", hubLarge: "812.8", hubSmall: "762.0", hubLength: "93.7", rf: "857.3" },
    WNRF: { size: "30\"", od: "984.2", pcd: "914.4", thk: "74.6", id: "762.0", hubLarge: "812.8", hubSmall: "762.0", hubLength: "134.9", rf: "857.3" },
    BLRF: { size: "30\"", od: "984.2", pcd: "914.4", thk: "74.6", rf: "857.3" }
  },
  "36\"": {
    SORF: { size: "36\"", od: "1168.4", pcd: "1085.8", thk: "90.5", id: "919.2", hubLarge: "965.2", hubSmall: "914.4", hubLength: "104.8", rf: "1022.4" },
    WNRF: { size: "36\"", od: "1168.4", pcd: "1085.8", thk: "90.5", id: "914.4", hubLarge: "965.2", hubSmall: "914.4", hubLength: "157.2", rf: "1022.4" },
    BLRF: { size: "36\"", od: "1168.4", pcd: "1085.8", thk: "90.5", rf: "1022.4" }
  },
  "48\"": {
    SORF: { size: "48\"", od: "1511.3", pcd: "1422.4", thk: "107.9", id: "1224.0", hubLarge: "1270.0", hubSmall: "1219.2", hubLength: "125.4", rf: "1358.9" },
    WNRF: { size: "48\"", od: "1511.3", pcd: "1422.4", thk: "107.9", id: "1219.2", hubLarge: "1270.0", hubSmall: "1219.2", hubLength: "185.7", rf: "1358.9" },
    BLRF: { size: "48\"", od: "1511.3", pcd: "1422.4", thk: "107.9", rf: "1358.9" }
  },
  "60\"": {
    SORF: { size: "60\"", od: "1854.2", pcd: "1765.3", thk: "131.8", id: "1528.8", hubLarge: "1581.2", hubSmall: "1524.0", hubLength: "150.8", rf: "1701.8" },
    WNRF: { size: "60\"", od: "1854.2", pcd: "1765.3", thk: "131.8", id: "1524.0", hubLarge: "1581.2", hubSmall: "1524.0", hubLength: "223.8", rf: "1701.8" },
    BLRF: { size: "60\"", od: "1854.2", pcd: "1765.3", thk: "131.8", rf: "1701.8" }
  }
};

export const FLANGE_STANDARDS_150_B: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "785.8", pcd: "744.5", thk: "35.0", id: "665.2", hubLarge: "682.6", hubSmall: "660.4", hubLength: "46.1", rf: "704.9" },
    WNRF: { size: "26\"", od: "785.8", pcd: "744.5", thk: "35.0", id: "660.4", hubLarge: "682.6", hubSmall: "660.4", hubLength: "87.3", rf: "704.9" },
    BLRF: { size: "26\"", od: "785.8", pcd: "744.5", thk: "35.0", rf: "704.9" }
  },
  "30\"": {
    SORF: { size: "30\"", od: "885.8", pcd: "841.4", thk: "38.1", id: "766.8", hubLarge: "784.2", hubSmall: "762.0", hubLength: "49.2", rf: "803.3" },
    WNRF: { size: "30\"", od: "885.8", pcd: "841.4", thk: "38.1", id: "762.0", hubLarge: "784.2", hubSmall: "762.0", hubLength: "95.2", rf: "803.3" },
    BLRF: { size: "30\"", od: "885.8", pcd: "841.4", thk: "38.1", rf: "803.3" }
  },
  "36\"": {
    SORF: { size: "36\"", od: "1047.8", pcd: "997.0", thk: "44.5", id: "919.2", hubLarge: "941.4", hubSmall: "914.4", hubLength: "55.6", rf: "965.2" },
    WNRF: { size: "36\"", od: "1047.8", pcd: "997.0", thk: "44.5", id: "914.4", hubLarge: "941.4", hubSmall: "914.4", hubLength: "108.0", rf: "965.2" },
    BLRF: { size: "36\"", od: "1047.8", pcd: "997.0", thk: "44.5", rf: "965.2" }
  },
  "48\"": {
    SORF: { size: "48\"", od: "1378.0", pcd: "1322.4", thk: "52.4", id: "1224.0", hubLarge: "1247.8", hubSmall: "1219.2", hubLength: "66.7", rf: "1282.7" },
    WNRF: { size: "48\"", od: "1378.0", pcd: "1322.4", thk: "52.4", id: "1219.2", hubLarge: "1247.8", hubSmall: "1219.2", hubLength: "133.4", rf: "1282.7" },
    BLRF: { size: "48\"", od: "1378.0", pcd: "1322.4", thk: "52.4", rf: "1282.7" }
  },
  "60\"": {
    SORF: { size: "60\"", od: "1714.5", pcd: "1657.4", thk: "66.7", id: "1528.8", hubLarge: "1552.6", hubSmall: "1524.0", hubLength: "81.0", rf: "1593.8" },
    WNRF: { size: "60\"", od: "1714.5", pcd: "1657.4", thk: "66.7", id: "1524.0", hubLarge: "1552.6", hubSmall: "1524.0", hubLength: "165.1", rf: "1593.8" },
    BLRF: { size: "60\"", od: "1714.5", pcd: "1657.4", thk: "66.7", rf: "1593.8" }
  }
};

export const FLANGE_STANDARDS_400_A: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "971.6", pcd: "876.3", thk: "88.9", id: "665.2", hubLarge: "730.3", hubSmall: "660.4", hubLength: "125.4", rf: "749.3" },
    WNRF: { size: "26\"", od: "971.6", pcd: "876.3", thk: "88.9", id: "660.4", hubLarge: "730.3", hubSmall: "660.4", hubLength: "165.1", rf: "749.3" },
    BLRF: { size: "26\"", od: "971.6", pcd: "876.3", thk: "88.9", rf: "749.3" }
  }
};

export const FLANGE_STANDARDS_400_B: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "844.5", pcd: "781.0", thk: "98.4", id: "665.2", hubLarge: "711.2", hubSmall: "660.4", hubLength: "104.8", rf: "704.9" },
    WNRF: { size: "26\"", od: "844.5", pcd: "781.0", thk: "98.4", id: "660.4", hubLarge: "711.2", hubSmall: "660.4", hubLength: "154.0", rf: "704.9" },
    BLRF: { size: "26\"", od: "844.5", pcd: "781.0", thk: "98.4", rf: "704.9" }
  }
};

export const FLANGE_STANDARDS_600_A: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "1016.0", pcd: "914.4", thk: "107.9", id: "665.2", hubLarge: "752.5", hubSmall: "660.4", hubLength: "144.5", rf: "749.3" },
    WNRF: { size: "26\"", od: "1016.0", pcd: "914.4", thk: "107.9", id: "660.4", hubLarge: "752.5", hubSmall: "660.4", hubLength: "184.2", rf: "749.3", schedules: { "SCH 40 (STD)": "660.4", "SCH 80 (XS)": "654.0" } },
    BLRF: { size: "26\"", od: "1016.0", pcd: "914.4", thk: "107.9", rf: "749.3" }
  },
  "30\"": {
    SORF: { size: "30\"", od: "1130.3", pcd: "1022.4", thk: "114.3", id: "766.8", hubLarge: "857.2", hubSmall: "762.0", hubLength: "158.8", rf: "857.3" },
    WNRF: { size: "30\"", od: "1130.3", pcd: "1022.4", thk: "114.3", id: "762.0", hubLarge: "857.2", hubSmall: "762.0", hubLength: "209.6", rf: "857.3", schedules: { "SCH 40 (STD)": "762.0", "SCH 80 (XS)": "749.3" } },
    BLRF: { size: "30\"", od: "1130.3", pcd: "1022.4", thk: "114.3", rf: "857.3" }
  }
};

export const FLANGE_STANDARDS_600_B: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "889.0", pcd: "806.4", thk: "111.1", id: "665.2", hubLarge: "723.9", hubSmall: "660.4", hubLength: "117.5", rf: "711.2" },
    WNRF: { size: "26\"", od: "889.0", pcd: "806.4", thk: "111.1", id: "660.4", hubLarge: "723.9", hubSmall: "660.4", hubLength: "166.7", rf: "711.2", schedules: { "SCH 40 (STD)": "660.4", "SCH 80 (XS)": "654.0" } },
    BLRF: { size: "26\"", od: "889.0", pcd: "806.4", thk: "111.1", rf: "711.2" }
  }
};

export const FLANGE_STANDARDS_900_A: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "1085.8", pcd: "952.5", thk: "139.7", id: "665.2", hubLarge: "787.4", hubSmall: "660.4", hubLength: "198.4", rf: "749.3" },
    WNRF: { size: "26\"", od: "1085.8", pcd: "952.5", thk: "139.7", id: "660.4", hubLarge: "787.4", hubSmall: "660.4", hubLength: "285.8", rf: "749.3", schedules: { "SCH 40 (STD)": "660.4", "SCH 80 (XS)": "654.0" } },
    BLRF: { size: "26\"", od: "1085.8", pcd: "952.5", thk: "139.7", rf: "749.3" }
  }
};

export const FLANGE_STANDARDS_900_B: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "1022.4", pcd: "914.4", thk: "155.6", id: "665.2", hubLarge: "774.7", hubSmall: "660.4", hubLength: "160.3", rf: "736.6" },
    WNRF: { size: "26\"", od: "1022.4", pcd: "914.4", thk: "155.6", id: "660.4", hubLarge: "774.7", hubSmall: "660.4", hubLength: "258.8", rf: "736.6" },
    BLRF: { size: "26\"", od: "1022.4", pcd: "914.4", thk: "155.6", rf: "736.6" }
  }
};


export const FLANGE_STANDARDS_300: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "1/2\"": { 
    SORF: { size: "1/2\"", od: "95.3", pcd: "66.5", thk: "14.3", id: "22.4", hubLarge: "38.1", hubSmall: "21.3", hubLength: "15.9", rf: "35.1" },
    WNRF: { size: "1/2\"", od: "95.3", pcd: "66.5", thk: "14.3", id: "15.8", hubLarge: "38.1", hubSmall: "21.3", hubLength: "52.3", rf: "35.1", schedules: { "SCH 5": "18.9", "SCH 10": "17.1", "SCH 40 (STD)": "15.8", "SCH 80 (XS)": "13.9", "SCH 160": "11.8", "SCH XXS": "6.4" } },
    BLRF: { size: "1/2\"", od: "95.3", pcd: "66.5", thk: "14.3", rf: "35.1" }
  },
  "3/4\"": { 
    SORF: { size: "3/4\"", od: "117.5", pcd: "82.6", thk: "15.9", id: "27.7", hubLarge: "54.0", hubSmall: "26.7", hubLength: "25.4", rf: "42.9" },
    WNRF: { size: "3/4\"", od: "117.5", pcd: "82.6", thk: "15.9", id: "20.9", hubLarge: "54.0", hubSmall: "26.7", hubLength: "57.2", rf: "42.9", schedules: { "SCH 5": "24.3", "SCH 10": "22.5", "SCH 40 (STD)": "20.9", "SCH 80 (XS)": "18.9", "SCH 160": "15.6", "SCH XXS": "11.0" } },
    BLRF: { size: "3/4\"", od: "117.5", pcd: "82.6", thk: "15.9", rf: "42.9" }
  },
  "1\"": { 
    SORF: { size: "1\"", od: "124.0", pcd: "88.9", thk: "17.5", id: "34.5", hubLarge: "61.9", hubSmall: "33.4", hubLength: "27.0", rf: "50.8" },
    WNRF: { size: "1\"", od: "124.0", pcd: "88.9", thk: "17.5", id: "26.7", hubLarge: "61.9", hubSmall: "33.4", hubLength: "61.9", rf: "50.8", schedules: { "SCH 5": "31.0", "SCH 10": "29.3", "SCH 40 (STD)": "26.7", "SCH 80 (XS)": "24.3", "SCH 160": "20.7", "SCH XXS": "15.2" } },
    BLRF: { size: "1\"", od: "124.0", pcd: "88.9", thk: "17.5", rf: "50.8" }
  },
  "1 1/4\"": { 
    SORF: { size: "1 1/4\"", od: "133.4", pcd: "98.4", thk: "19.1", id: "43.2", hubLarge: "73.0", hubSmall: "42.2", hubLength: "27.0", rf: "63.5" },
    WNRF: { size: "1 1/4\"", od: "133.4", pcd: "98.4", thk: "19.1", id: "35.1", hubLarge: "73.0", hubSmall: "42.2", hubLength: "73.0", rf: "63.5" },
    BLRF: { size: "1 1/4\"", od: "133.4", pcd: "98.4", thk: "19.1", rf: "63.5" }
  },
  "1 1/2\"": { 
    SORF: { size: "1 1/2\"", od: "155.6", pcd: "114.3", thk: "20.6", id: "49.5", hubLarge: "82.6", hubSmall: "82.6", hubLength: "30.2", rf: "73.0" },
    WNRF: { size: "1 1/2\"", od: "155.6", pcd: "114.3", thk: "20.6", id: "40.9", hubLarge: "82.6", hubSmall: "48.3", hubLength: "68.3", rf: "73.0", schedules: { "SCH 40 (STD)": "40.9", "SCH 80 (XS)": "38.1", "SCH 160": "34.0", "SCH XXS": "27.9" } },
    BLRF: { size: "1 1/2\"", od: "155.6", pcd: "114.3", thk: "20.6", rf: "73.0" }
  },
  "2\"": { 
    SORF: { size: "2\"", od: "165.1", pcd: "127.0", thk: "22.2", id: "62.0", hubLarge: "84.1", hubSmall: "84.1", hubLength: "33.3", rf: "92.1" },
    WNRF: { size: "2\"", od: "165.1", pcd: "127.0", thk: "22.2", id: "52.5", hubLarge: "84.1", hubSmall: "60.3", hubLength: "69.9", rf: "92.1", schedules: { "SCH 40 (STD)": "52.5", "SCH 80 (XS)": "49.3", "SCH 160": "42.8", "SCH XXS": "38.2" } },
    BLRF: { size: "2\"", od: "165.1", pcd: "127.0", thk: "22.2", rf: "92.1" }
  },
  "2 1/2\"": { 
    SORF: { size: "2 1/2\"", od: "190.5", pcd: "149.2", thk: "28.6", id: "74.7", hubLarge: "117.5", hubSmall: "73.0", hubLength: "47.6", rf: "104.8" },
    WNRF: { size: "2 1/2\"", od: "190.5", pcd: "149.2", thk: "28.6", id: "62.7", hubLarge: "117.5", hubSmall: "73.0", hubLength: "76.2", rf: "104.8" },
    BLRF: { size: "2 1/2\"", od: "190.5", pcd: "149.2", thk: "28.6", rf: "104.8" }
  },
  "3\"": { 
    SORF: { size: "3\"", od: "209.6", pcd: "168.3", thk: "28.6", id: "90.7", hubLarge: "127.0", hubSmall: "127.0", hubLength: "42.9", rf: "127.0" },
    WNRF: { size: "3\"", od: "209.6", pcd: "168.3", thk: "28.6", id: "77.9", hubLarge: "127.0", hubSmall: "88.9", hubLength: "79.4", rf: "127.0", schedules: { "SCH 40 (STD)": "77.9", "SCH 80 (XS)": "73.7", "SCH 160": "66.6", "SCH XXS": "58.4" } },
    BLRF: { size: "3\"", od: "209.6", pcd: "168.3", thk: "28.6", rf: "127.0" }
  },
  "3 1/2\"": { 
    SORF: { size: "3 1/2\"", od: "228.6", pcd: "190.5", thk: "30.2", id: "103.1", hubLarge: "146.1", hubSmall: "101.6", hubLength: "44.4", rf: "139.7" },
    WNRF: { size: "3 1/2\"", od: "228.6", pcd: "190.5", thk: "30.2", id: "90.1", hubLarge: "146.1", hubSmall: "101.6", hubLength: "81.0", rf: "139.7" },
    BLRF: { size: "3 1/2\"", od: "228.6", pcd: "190.5", thk: "30.2", rf: "139.7" }
  },
  "4\"": { 
    SORF: { size: "4\"", od: "254.0", pcd: "200.0", thk: "31.8", id: "116.1", hubLarge: "146.1", hubSmall: "146.1", hubLength: "36.5", rf: "157.2" },
    WNRF: { size: "4\"", od: "254.0", pcd: "200.0", thk: "31.8", id: "102.3", hubLarge: "146.1", hubSmall: "114.3", hubLength: "76.2", rf: "157.2", schedules: { "SCH 40 (STD)": "102.3", "SCH 80 (XS)": "97.2", "SCH 120": "92.0", "SCH 160": "87.3", "SCH XXS": "80.1" } },
    BLRF: { size: "4\"", od: "254.0", pcd: "200.0", thk: "31.8", rf: "157.2" }
  },
  "6\"": { 
    SORF: { size: "6\"", od: "317.5", pcd: "269.9", thk: "36.5", id: "170.7", hubLarge: "211.1", hubSmall: "211.1", hubLength: "46.0", rf: "215.9" },
    WNRF: { size: "6\"", od: "317.5", pcd: "269.9", thk: "36.5", id: "154.1", hubLarge: "211.1", hubSmall: "168.3", hubLength: "88.9", rf: "215.9", schedules: { "SCH 40 (STD)": "154.1", "SCH 80 (XS)": "146.3", "SCH 120": "139.7", "SCH 160": "131.8", "SCH XXS": "124.4" } },
    BLRF: { size: "6\"", od: "317.5", pcd: "269.9", thk: "36.5", rf: "215.9" }
  },
  "8\"": { 
    SORF: { size: "8\"", od: "381.0", pcd: "330.2", thk: "41.3", id: "221.5", hubLarge: "269.9", hubSmall: "269.9", hubLength: "61.9", rf: "269.9" },
    WNRF: { size: "8\"", od: "381.0", pcd: "330.2", thk: "41.3", id: "202.7", hubLarge: "269.9", hubSmall: "219.1", hubLength: "111.1", rf: "269.9", schedules: { "SCH 20": "206.4", "SCH 30": "205.0", "SCH 40 (STD)": "202.7", "SCH 60": "198.5", "SCH 80 (XS)": "193.7", "SCH 100": "188.9", "SCH 120": "182.5", "SCH 140": "177.8", "SCH 160": "173.1", "SCH XXS": "174.6" } },
    BLRF: { size: "8\"", od: "381.0", pcd: "330.2", thk: "41.3", rf: "269.9" }
  },
  "10\"": { 
    SORF: { size: "10\"", od: "444.5", pcd: "387.4", thk: "47.8", id: "276.4", hubLarge: "323.9", hubSmall: "323.9", hubLength: "66.7", rf: "323.8" },
    WNRF: { size: "10\"", od: "444.5", pcd: "387.4", thk: "47.8", id: "254.5", hubLarge: "323.9", hubSmall: "273.0", hubLength: "117.5", rf: "323.8", schedules: { "SCH 20": "260.4", "SCH 30": "257.5", "SCH 40 (STD)": "254.5", "SCH 60": "247.7", "SCH 80 (XS)": "242.9", "SCH 100": "236.6", "SCH 120": "230.2", "SCH 140": "222.3", "SCH 160": "215.9", "SCH XXS": "222.3" } },
    BLRF: { size: "10\"", od: "444.5", pcd: "387.4", thk: "47.8", rf: "323.8" }
  },
  "12\"": { 
    SORF: { size: "12\"", od: "520.7", pcd: "450.8", thk: "50.8", id: "327.2", hubLarge: "381.0", hubSmall: "381.0", hubLength: "73.0", rf: "381.0" },
    WNRF: { size: "12\"", od: "520.7", pcd: "450.8", thk: "50.8", id: "304.8", hubLarge: "381.0", hubSmall: "323.8", hubLength: "130.2", rf: "381.0", schedules: { "SCH 20": "311.2", "SCH 30": "307.1", "SCH 40 (STD)": "304.8", "SCH 60": "295.4", "SCH 80 (XS)": "288.9", "SCH 100": "281.0", "SCH 120": "273.1", "SCH 140": "266.7", "SCH 160": "257.2", "SCH XXS": "273.1" } },
    BLRF: { size: "12\"", od: "520.7", pcd: "450.8", thk: "50.8", rf: "381.0" }
  },
  "14\"": {
    SORF: { size: "14\"", od: "584.2", pcd: "514.4", thk: "53.9", id: "359.2", hubLarge: "457.2", hubSmall: "355.6", hubLength: "76.2", rf: "412.8" },
    WNRF: { size: "14\"", od: "584.2", pcd: "514.4", thk: "53.9", id: "336.6", hubLarge: "457.2", hubSmall: "355.6", hubLength: "142.9", rf: "412.8", schedules: { "SCH 40 (STD)": "336.6", "SCH 80 (XS)": "325.4" } },
    BLRF: { size: "14\"", od: "584.2", pcd: "514.4", thk: "53.9", rf: "412.8" }
  }
};

export const FLANGE_STANDARDS_300_A: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "971.6", pcd: "876.3", thk: "79.4", id: "665.2", hubLarge: "730.2", hubSmall: "660.4", hubLength: "101.6", rf: "749.3" },
    WNRF: { size: "26\"", od: "971.6", pcd: "876.3", thk: "79.4", id: "660.4", hubLarge: "730.2", hubSmall: "660.4", hubLength: "144.5", rf: "749.3" },
    BLRF: { size: "26\"", od: "971.6", pcd: "876.3", thk: "79.4", rf: "749.3" }
  },
  "30\"": {
    SORF: { size: "30\"", od: "1092.2", pcd: "990.6", thk: "92.1", id: "766.8", hubLarge: "831.8", hubSmall: "762.0", hubLength: "114.3", rf: "857.3" },
    WNRF: { size: "30\"", od: "1092.2", pcd: "990.6", thk: "92.1", id: "762.0", hubLarge: "831.8", hubSmall: "762.0", hubLength: "160.3", rf: "857.3" },
    BLRF: { size: "30\"", od: "1092.2", pcd: "990.6", thk: "92.1", rf: "857.3" }
  },
  "36\"": {
    SORF: { size: "36\"", od: "1270.0", pcd: "1168.4", thk: "104.8", id: "919.2", hubLarge: "990.6", hubSmall: "914.4", hubLength: "130.2", rf: "1022.4" },
    WNRF: { size: "36\"", od: "1270.0", pcd: "1168.4", thk: "104.8", id: "914.4", hubLarge: "990.6", hubSmall: "914.4", hubLength: "181.0", rf: "1022.4" },
    BLRF: { size: "36\"", od: "1270.0", pcd: "1168.4", thk: "104.8", rf: "1022.4" }
  }
};

export const FLANGE_STANDARDS_300_B: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "26\"": {
    SORF: { size: "26\"", od: "866.8", pcd: "803.3", thk: "82.6", id: "665.2", hubLarge: "711.2", hubSmall: "660.4", hubLength: "88.9", rf: "727.1" },
    WNRF: { size: "26\"", od: "866.8", pcd: "803.3", thk: "82.6", id: "660.4", hubLarge: "711.2", hubSmall: "660.4", hubLength: "138.1", rf: "727.1" },
    BLRF: { size: "26\"", od: "866.8", pcd: "803.3", thk: "82.6", rf: "727.1" }
  },
  "30\"": {
    SORF: { size: "30\"", od: "990.6", pcd: "914.4", thk: "93.7", id: "766.8", hubLarge: "812.8", hubSmall: "762.0", hubLength: "101.6", rf: "831.9" },
    WNRF: { size: "30\"", od: "990.6", pcd: "914.4", thk: "93.7", id: "762.0", hubLarge: "812.8", hubSmall: "762.0", hubLength: "155.6", rf: "831.9" },
    BLRF: { size: "30\"", od: "990.6", pcd: "914.4", thk: "93.7", rf: "831.9" }
  },
  "36\"": {
    SORF: { size: "36\"", od: "1155.7", pcd: "1085.8", thk: "123.8", id: "919.2", hubLarge: "968.4", hubSmall: "914.4", hubLength: "130.2", rf: "990.6" },
    WNRF: { size: "36\"", od: "1155.7", pcd: "1085.8", thk: "123.8", id: "914.4", hubLarge: "968.4", hubSmall: "914.4", hubLength: "185.7", rf: "990.6" },
    BLRF: { size: "36\"", od: "1155.7", pcd: "1085.8", thk: "123.8", rf: "990.6" }
  }
};


export const FLANGE_STANDARDS_600: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "1/2\"": { 
    SORF: { size: "1/2\"", od: "95.3", pcd: "66.5", thk: "14.3", id: "22.4", hubLarge: "38.1", hubSmall: "38.1", hubLength: "22.3", rf: "35.1" },
    WNRF: { size: "1/2\"", od: "95.3", pcd: "66.5", thk: "14.3", id: "15.8", hubLarge: "38.1", hubSmall: "21.3", hubLength: "52.3", rf: "35.1", schedules: { "SCH 40 (STD)": "15.8", "SCH 80 (XS)": "13.9", "SCH 160": "11.8", "SCH XXS": "6.4" } },
    BLRF: { size: "1/2\"", od: "95.3", pcd: "66.5", thk: "14.3", rf: "35.1" }
  },
  "3/4\"": { 
    SORF: { size: "3/4\"", od: "117.5", pcd: "82.6", thk: "15.9", id: "27.7", hubLarge: "54.0", hubSmall: "54.0", hubLength: "25.4", rf: "42.9" },
    WNRF: { size: "3/4\"", od: "117.5", pcd: "82.6", thk: "15.9", id: "20.9", hubLarge: "54.0", hubSmall: "26.7", hubLength: "57.2", rf: "42.9", schedules: { "SCH 40 (STD)": "20.9", "SCH 80 (XS)": "18.9", "SCH 160": "15.6", "SCH XXS": "11.0" } },
    BLRF: { size: "3/4\"", od: "117.5", pcd: "82.6", thk: "15.9", rf: "42.9" }
  },
  "1\"": { 
    SORF: { size: "1\"", od: "124.0", pcd: "88.9", thk: "17.5", id: "34.5", hubLarge: "54.0", hubSmall: "54.0", hubLength: "27.0", rf: "50.8" },
    WNRF: { size: "1\"", od: "124.0", pcd: "88.9", thk: "17.5", id: "26.7", hubLarge: "54.0", hubSmall: "33.4", hubLength: "60.0", rf: "50.8", schedules: { "SCH 40 (STD)": "26.7", "SCH 80 (XS)": "24.3", "SCH 160": "20.7", "SCH XXS": "15.2" } },
    BLRF: { size: "1\"", od: "124.0", pcd: "88.9", thk: "17.5", rf: "50.8" }
  },
  "1 1/4\"": { 
    SORF: { size: "1 1/4\"", od: "133.4", pcd: "98.4", thk: "20.6", id: "43.2", hubLarge: "73.0", hubSmall: "42.2", hubLength: "27.0", rf: "63.5" },
    WNRF: { size: "1 1/4\"", od: "133.4", pcd: "98.4", thk: "20.6", id: "35.1", hubLarge: "73.0", hubSmall: "42.2", hubLength: "73.0", rf: "63.5" },
    BLRF: { size: "1 1/4\"", od: "133.4", pcd: "98.4", thk: "20.6", rf: "63.5" }
  },
  "1 1/2\"": { 
    SORF: { size: "1 1/2\"", od: "155.6", pcd: "114.3", thk: "22.2", id: "49.5", hubLarge: "82.6", hubSmall: "82.6", hubLength: "31.8", rf: "73.0" },
    WNRF: { size: "1 1/2\"", od: "155.6", pcd: "114.3", thk: "22.2", id: "40.9", hubLarge: "82.6", hubSmall: "48.3", hubLength: "71.4", rf: "73.0", schedules: { "SCH 40 (STD)": "40.9", "SCH 80 (XS)": "38.1", "SCH 160": "34.0", "SCH XXS": "27.9" } },
    BLRF: { size: "1 1/2\"", od: "155.6", pcd: "114.3", thk: "22.2", rf: "73.0" }
  },
  "2\"": { 
    SORF: { size: "2\"", od: "165.1", pcd: "127.0", thk: "25.4", id: "62.0", hubLarge: "84.1", hubSmall: "84.1", hubLength: "36.5", rf: "92.1" },
    WNRF: { size: "2\"", od: "165.1", pcd: "127.0", thk: "25.4", id: "52.5", hubLarge: "84.1", hubSmall: "60.3", hubLength: "73.0", rf: "92.1", schedules: { "SCH 40 (STD)": "52.5", "SCH 80 (XS)": "49.3", "SCH 160": "42.8", "SCH XXS": "38.2" } },
    BLRF: { size: "2\"", od: "165.1", pcd: "127.0", thk: "25.4", rf: "92.1" }
  },
  "2 1/2\"": { 
    SORF: { size: "2 1/2\"", od: "190.5", pcd: "149.2", thk: "28.6", id: "74.7", hubLarge: "117.5", hubSmall: "73.0", hubLength: "47.6", rf: "104.8" },
    WNRF: { size: "2 1/2\"", od: "190.5", pcd: "149.2", thk: "28.6", id: "62.7", hubLarge: "117.5", hubSmall: "73.0", hubLength: "76.2", rf: "104.8" },
    BLRF: { size: "2 1/2\"", od: "190.5", pcd: "149.2", thk: "28.6", rf: "104.8" }
  },
  "3\"": { 
    SORF: { size: "3\"", od: "209.6", pcd: "168.3", thk: "31.8", id: "90.7", hubLarge: "127.0", hubSmall: "127.0", hubLength: "46.0", rf: "127.0" },
    WNRF: { size: "3\"", od: "209.6", pcd: "168.3", thk: "31.8", id: "77.9", hubLarge: "127.0", hubSmall: "88.9", hubLength: "82.6", rf: "127.0", schedules: { "SCH 40 (STD)": "77.9", "SCH 80 (XS)": "73.7", "SCH 160": "66.6", "SCH XXS": "58.4" } },
    BLRF: { size: "3\"", od: "209.6", pcd: "168.3", thk: "31.8", rf: "127.0" }
  },
  "3 1/2\"": { 
    SORF: { size: "3 1/2\"", od: "228.6", pcd: "190.5", thk: "35.0", id: "103.1", hubLarge: "146.1", hubSmall: "101.6", hubLength: "54.0", rf: "139.7" },
    WNRF: { size: "3 1/2\"", od: "228.6", pcd: "190.5", thk: "35.0", id: "90.1", hubLarge: "146.1", hubSmall: "101.6", hubLength: "85.7", rf: "139.7" },
    BLRF: { size: "3 1/2\"", od: "228.6", pcd: "190.5", thk: "35.0", rf: "139.7" }
  },
  "4\"": { 
    SORF: { size: "4\"", od: "273.1", pcd: "215.9", thk: "38.1", id: "116.1", hubLarge: "152.4", hubSmall: "152.4", hubLength: "47.6", rf: "157.2" },
    WNRF: { size: "4\"", od: "273.1", pcd: "215.9", thk: "38.1", id: "102.3", hubLarge: "152.4", hubSmall: "114.3", hubLength: "101.6", rf: "157.2", schedules: { "SCH 40 (STD)": "102.3", "SCH 80 (XS)": "97.2", "SCH 120": "92.0", "SCH 160": "87.3", "SCH XXS": "80.1" } },
    BLRF: { size: "4\"", od: "273.1", pcd: "215.9", thk: "38.1", rf: "157.2" }
  },
  "6\"": { 
    SORF: { size: "6\"", od: "355.6", pcd: "292.1", thk: "47.7", id: "170.7", hubLarge: "222.3", hubSmall: "222.3", hubLength: "58.7", rf: "215.9" },
    WNRF: { size: "6\"", od: "355.6", pcd: "292.1", thk: "47.7", id: "154.1", hubLarge: "222.3", hubSmall: "168.3", hubLength: "117.5", rf: "215.9", schedules: { "SCH 40 (STD)": "154.1", "SCH 80 (XS)": "146.3", "SCH 120": "139.7", "SCH 160": "131.8", "SCH XXS": "124.4" } },
    BLRF: { size: "6\"", od: "355.6", pcd: "292.1", thk: "47.7", rf: "215.9" }
  },
  "8\"": { 
    SORF: { size: "8\"", od: "419.1", pcd: "349.3", thk: "55.6", id: "221.5", hubLarge: "269.9", hubSmall: "269.9", hubLength: "68.3", rf: "269.9" },
    WNRF: { size: "8\"", od: "419.1", pcd: "349.3", thk: "55.6", id: "202.7", hubLarge: "298.5", hubSmall: "219.1", hubLength: "133.4", rf: "269.9", schedules: { "SCH 10": "211.6", "SCH 20": "206.4", "SCH 30": "205.0", "SCH 40 (STD)": "202.7", "SCH 60": "198.5", "SCH 80 (XS)": "193.7", "SCH 100": "188.9", "SCH 120": "182.5", "SCH 140": "177.8", "SCH 160": "173.1", "SCH XXS": "174.6" } },
    BLRF: { size: "8\"", od: "419.1", pcd: "349.3", thk: "55.6", rf: "269.9" }
  },
  "10\"": { 
    SORF: { size: "10\"", od: "508.0", pcd: "431.8", thk: "63.5", id: "276.4", hubLarge: "342.9", hubSmall: "342.9", hubLength: "101.6", rf: "323.8" },
    WNRF: { size: "10\"", od: "508.0", pcd: "431.8", thk: "63.5", id: "254.5", hubLarge: "368.3", hubSmall: "273.0", hubLength: "152.4", rf: "323.8", schedules: { "SCH 10": "264.7", "SCH 20": "260.4", "SCH 30": "257.5", "SCH 40 (STD)": "254.5", "SCH 60": "247.7", "SCH 80 (XS)": "242.9", "SCH 100": "236.6", "SCH 120": "230.2", "SCH 140": "222.3", "SCH 160": "215.9", "SCH XXS": "222.3" } },
    BLRF: { size: "10\"", od: "508.0", pcd: "431.8", thk: "63.5", rf: "323.8" }
  },
  "12\"": { 
    SORF: { size: "12\"", od: "558.8", pcd: "489.0", thk: "66.7", id: "327.2", hubLarge: "381.0", hubSmall: "381.0", hubLength: "108.0", rf: "381.0" },
    WNRF: { size: "12\"", od: "558.8", pcd: "489.0", thk: "66.7", id: "304.8", hubLarge: "419.1", hubSmall: "323.8", hubLength: "155.6", rf: "381.0", schedules: { "SCH 10": "314.7", "SCH 20": "311.2", "SCH 30": "307.1", "SCH 40 (STD)": "304.8", "SCH 60": "295.4", "SCH 80 (XS)": "288.9", "SCH 100": "281.0", "SCH 120": "273.1", "SCH 140": "266.7", "SCH 160": "257.2", "SCH XXS": "273.1" } },
    BLRF: { size: "12\"", od: "558.8", pcd: "489.0", thk: "66.7", rf: "381.0" }
  },
  "14\"": { 
    SORF: { size: "14\"", od: "603.3", pcd: "527.1", thk: "69.9", id: "359.2", hubLarge: "438.2", hubSmall: "438.2", hubLength: "111.1", rf: "412.8" },
    WNRF: { size: "14\"", od: "603.3", pcd: "527.1", thk: "69.9", id: "333.3", hubLarge: "457.2", hubSmall: "355.6", hubLength: "165.1", rf: "412.8", schedules: { "SCH 10": "342.9", "SCH 20": "339.7", "SCH 30": "333.3", "SCH 40 (STD)": "333.3", "SCH 60": "320.7", "SCH 80 (XS)": "317.5", "SCH 100": "304.8", "SCH 120": "295.3", "SCH 140": "284.1", "SCH 160": "273.1" } },
    BLRF: { size: "14\"", od: "603.3", pcd: "527.1", thk: "69.9", rf: "412.8" }
  },
  "16\"": { 
    SORF: { size: "16\"", od: "685.8", pcd: "603.3", thk: "76.2", id: "410.5", hubLarge: "489.0", hubSmall: "489.0", hubLength: "120.7", rf: "469.9" },
    WNRF: { size: "16\"", od: "685.8", pcd: "603.3", thk: "76.2", id: "381.0", hubLarge: "508.0", hubSmall: "406.4", hubLength: "177.8", rf: "469.9", schedules: { "SCH 10": "393.7", "SCH 20": "387.3", "SCH 30": "381.0", "SCH 40 (STD)": "381.0", "SCH 60": "363.5", "SCH 80 (XS)": "358.8", "SCH 100": "342.9", "SCH 120": "333.4", "SCH 140": "320.7", "SCH 160": "307.9" } },
    BLRF: { size: "16\"", od: "685.8", pcd: "603.3", thk: "76.2", rf: "469.9" }
  },
  "18\"": { 
    SORF: { size: "18\"", od: "743.0", pcd: "654.1", thk: "82.6", id: "461.8", hubLarge: "546.1", hubSmall: "546.1", hubLength: "127.0", rf: "533.4" },
    WNRF: { size: "18\"", od: "743.0", pcd: "654.1", thk: "82.6", id: "428.6", hubLarge: "558.8", hubSmall: "457.2", hubLength: "184.2", rf: "533.4", schedules: { "SCH 10": "444.5", "SCH 20": "435.0", "SCH 30": "428.6", "SCH 40 (STD)": "428.6", "SCH 60": "409.6", "SCH 80 (XS)": "403.2", "SCH 100": "387.4", "SCH 120": "371.5", "SCH 140": "358.8", "SCH 160": "342.9" } },
    BLRF: { size: "18\"", od: "743.0", pcd: "654.1", thk: "82.6", rf: "533.4" }
  },
  "20\"": { 
    SORF: { size: "20\"", od: "812.8", pcd: "723.9", thk: "88.9", id: "513.1", hubLarge: "609.6", hubSmall: "609.6", hubLength: "135.0", rf: "584.2" },
    WNRF: { size: "20\"", od: "812.8", pcd: "723.9", thk: "88.9", id: "477.8", hubLarge: "609.6", hubSmall: "508.0", hubLength: "190.5", rf: "584.2", schedules: { "SCH 10": "495.3", "SCH 20": "485.8", "SCH 30": "477.8", "SCH 40 (STD)": "477.8", "SCH 60": "455.6", "SCH 80 (XS)": "447.7", "SCH 100": "428.6", "SCH 120": "412.7", "SCH 140": "396.9", "SCH 160": "381.1" } },
    BLRF: { size: "20\"", od: "812.8", pcd: "723.9", thk: "88.9", rf: "584.2" }
  },
  "24\"": { 
    SORF: { size: "24\"", od: "939.8", pcd: "838.2", thk: "101.6", id: "616.0", hubLarge: "717.6", hubSmall: "717.6", hubLength: "152.0", rf: "692.2" },
    WNRF: { size: "24\"", od: "939.8", pcd: "838.2", thk: "101.6", id: "574.6", hubLarge: "711.2", hubSmall: "609.6", hubLength: "203.2", rf: "692.2", schedules: { "SCH 10": "596.9", "SCH 20": "584.2", "SCH 30": "574.6", "SCH 40 (STD)": "574.6", "SCH 60": "547.7", "SCH 80 (XS)": "536.6", "SCH 100": "514.4", "SCH 120": "495.3", "SCH 140": "476.3", "SCH 160": "457.3" } },
    BLRF: { size: "24\"", od: "939.8", pcd: "838.2", thk: "101.6", rf: "692.2" }
  }
};

export const FLANGE_STANDARDS_400: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "4\"": { 
    SORF: { size: "4\"", od: "254.0", pcd: "200.0", thk: "35.0", id: "116.1", hubLarge: "146.1", hubSmall: "114.3", hubLength: "50.8", rf: "157.2" },
    WNRF: { size: "4\"", od: "254.0", pcd: "200.0", thk: "35.0", id: "102.3", hubLarge: "146.1", hubSmall: "114.3", hubLength: "88.9", rf: "157.2" },
    BLRF: { size: "4\"", od: "254.0", pcd: "200.0", thk: "35.0", rf: "157.2" }
  },
  "6\"": { 
    SORF: { size: "6\"", od: "317.5", pcd: "269.9", thk: "41.3", id: "170.7", hubLarge: "211.1", hubSmall: "168.3", hubLength: "52.4", rf: "215.9" },
    WNRF: { size: "6\"", od: "317.5", pcd: "269.9", thk: "41.3", id: "154.1", hubLarge: "211.1", hubSmall: "168.3", hubLength: "103.1", rf: "215.9" },
    BLRF: { size: "6\"", od: "317.5", pcd: "269.9", thk: "41.3", rf: "215.9" }
  }
};

export const FLANGE_STANDARDS_900: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "1/2\"": { 
    SORF: { size: "1/2\"", od: "120.7", pcd: "82.6", thk: "22.2", id: "22.4", hubLarge: "38.1", hubSmall: "21.3", hubLength: "31.8", rf: "35.1" },
    WNRF: { size: "1/2\"", od: "120.7", pcd: "82.6", thk: "22.2", id: "15.8", hubLarge: "38.1", hubSmall: "21.3", hubLength: "60.3", rf: "35.1" },
    BLRF: { size: "1/2\"", od: "120.7", pcd: "82.6", thk: "22.2", rf: "35.1" }
  },
  "2\"": { 
    SORF: { size: "2\"", od: "215.9", pcd: "165.1", thk: "38.1", id: "62.0", hubLarge: "104.8", hubSmall: "60.3", hubLength: "57.2", rf: "92.1" },
    WNRF: { size: "2\"", od: "215.9", pcd: "165.1", thk: "38.1", id: "52.5", hubLarge: "104.8", hubSmall: "60.3", hubLength: "101.6", rf: "92.1" },
    BLRF: { size: "2\"", od: "215.9", pcd: "165.1", thk: "38.1", rf: "92.1" }
  },
  "4\"": { 
    SORF: { size: "4\"", od: "292.1", pcd: "235.0", thk: "44.5", id: "116.1", hubLarge: "158.8", hubSmall: "114.3", hubLength: "69.9", rf: "157.2" },
    WNRF: { size: "4\"", od: "292.1", pcd: "235.0", thk: "44.5", id: "102.3", hubLarge: "158.8", hubSmall: "114.3", hubLength: "114.3", rf: "157.2" },
    BLRF: { size: "4\"", od: "292.1", pcd: "235.0", thk: "44.5", rf: "157.2" }
  },
  "10\"": { 
    SORF: { size: "10\"", od: "546.1", pcd: "469.9", thk: "69.9", id: "276.4", hubLarge: "425.5", hubSmall: "273.0", hubLength: "108.0", rf: "323.8" },
    WNRF: { size: "10\"", od: "546.1", pcd: "469.9", thk: "69.9", id: "254.5", hubLarge: "425.5", hubSmall: "273.0", hubLength: "184.2", rf: "323.8" },
    BLRF: { size: "10\"", od: "546.1", pcd: "469.9", thk: "69.9", rf: "323.8" }
  }
};

export const FLANGE_STANDARDS_1500: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "1/2\"": { 
    SORF: { size: "1/2\"", od: "120.7", pcd: "82.6", thk: "22.2", id: "22.4", hubLarge: "38.1", hubSmall: "21.3", hubLength: "31.8", rf: "35.1" },
    WNRF: { size: "1/2\"", od: "120.7", pcd: "82.6", thk: "22.2", id: "15.8", hubLarge: "38.1", hubSmall: "21.3", hubLength: "60.3", rf: "35.1" },
    BLRF: { size: "1/2\"", od: "120.7", pcd: "82.6", thk: "22.2", rf: "35.1" }
  },
  "2\"": { 
    SORF: { size: "2\"", od: "215.9", pcd: "165.1", thk: "38.1", id: "62.0", hubLarge: "104.8", hubSmall: "60.3", hubLength: "57.2", rf: "92.1" },
    WNRF: { size: "2\"", od: "215.9", pcd: "165.1", thk: "38.1", id: "52.5", hubLarge: "104.8", hubSmall: "60.3", hubLength: "101.6", rf: "92.1" },
    BLRF: { size: "2\"", od: "215.9", pcd: "165.1", thk: "38.1", rf: "92.1" }
  },
  "4\"": {
    SORF: { size: "4\"", od: "311.2", pcd: "241.3", thk: "53.9", id: "116.1", hubLarge: "161.9", hubSmall: "114.3", hubLength: "73.0", rf: "157.2" },
    WNRF: { size: "4\"", od: "311.2", pcd: "241.3", thk: "53.9", id: "102.3", hubLarge: "161.9", hubSmall: "114.3", hubLength: "114.3", rf: "157.2" },
    BLRF: { size: "4\"", od: "311.2", pcd: "241.3", thk: "53.9", rf: "157.2" }
  },
  "6\"": {
    SORF: { size: "6\"", od: "393.7", pcd: "317.5", thk: "82.6", id: "170.7", hubLarge: "228.6", hubSmall: "168.3", hubLength: "104.8", rf: "215.9" },
    WNRF: { size: "6\"", od: "393.7", pcd: "317.5", thk: "82.6", id: "154.1", hubLarge: "228.6", hubSmall: "168.3", hubLength: "171.5", rf: "215.9" },
    BLRF: { size: "6\"", od: "393.7", pcd: "317.5", thk: "82.6", rf: "215.9" }
  }
};

export const FLANGE_STANDARDS_2500: Record<string, { SORF: FlangeDimensions; WNRF: FlangeDimensions; BLRF: FlangeDimensions }> = {
  "1/2\"": { 
    SORF: { size: "1/2\"", od: "133.4", pcd: "88.9", thk: "30.2", id: "22.4", hubLarge: "42.9", hubSmall: "21.3", hubLength: "39.7", rf: "35.1" },
    WNRF: { size: "1/2\"", od: "133.4", pcd: "88.9", thk: "30.2", id: "15.8", hubLarge: "42.9", hubSmall: "21.3", hubLength: "73.0", rf: "35.1" },
    BLRF: { size: "1/2\"", od: "133.4", pcd: "88.9", thk: "30.2", rf: "35.1" }
  },
  "2\"": { 
    SORF: { size: "2\"", od: "235.0", pcd: "171.5", thk: "50.8", id: "62.0", hubLarge: "114.3", hubSmall: "60.3", hubLength: "76.2", rf: "92.1" },
    WNRF: { size: "2\"", od: "235.0", pcd: "171.5", thk: "50.8", id: "52.5", hubLarge: "114.3", hubSmall: "60.3", hubLength: "127.0", rf: "92.1" },
    BLRF: { size: "2\"", od: "235.0", pcd: "171.5", thk: "50.8", rf: "92.1" }
  },
  "4\"": {
    SORF: { size: "4\"", od: "355.6", pcd: "273.1", thk: "76.2", id: "116.1", hubLarge: "203.2", hubSmall: "114.3", hubLength: "108.0", rf: "157.2" },
    WNRF: { size: "4\"", od: "355.6", pcd: "273.1", thk: "76.2", id: "102.3", hubLarge: "203.2", hubSmall: "114.3", hubLength: "190.5", rf: "157.2" },
    BLRF: { size: "4\"", od: "355.6", pcd: "273.1", thk: "76.2", rf: "157.2" }
  }
};

export const FITTING_STANDARDS: Record<string, any> = {
  "1/2\"": { 
    od: "21.3", 
    centerToEnd_90_LR_Elbow: "38", centerToEnd_45_Elbow: "16", centerToEnd_45_LR_Elbow: "16", centerToEnd_90_SR_Elbow: "25", centerToEnd_45_SR_Elbow: "11", centerToCenter_180_LR_Elbow: "76", centerToCenter_180_SR_Elbow: "51", centerToEnd_Tee: "25",
    length: "38", height: "25", stubEndLength: "51", stubEndLengthShort: "25",
    schedules: { "SCH 40 (STD)": "2.77", "SCH 80 (XS)": "3.73", "SCH 160": "4.78", "SCH XXS": "7.47" }
  },
  "3/4\"": { 
    od: "26.7", 
    centerToEnd_90_LR_Elbow: "38", centerToEnd_45_Elbow: "19", centerToEnd_45_LR_Elbow: "19", centerToEnd_90_SR_Elbow: "25", centerToEnd_45_SR_Elbow: "11", centerToCenter_180_LR_Elbow: "76", centerToCenter_180_SR_Elbow: "51", centerToEnd_Tee: "29",
    length: "38", height: "25", stubEndLength: "51", stubEndLengthShort: "25",
    schedules: { "SCH 40 (STD)": "2.87", "SCH 80 (XS)": "3.91", "SCH 160": "5.56", "SCH XXS": "7.82" }
  },
  "1\"": { 
    od: "33.4", 
    centerToEnd_90_LR_Elbow: "38", centerToEnd_45_Elbow: "22", centerToEnd_45_LR_Elbow: "22", centerToEnd_90_SR_Elbow: "25", centerToEnd_45_SR_Elbow: "11", centerToCenter_180_LR_Elbow: "76", centerToCenter_180_SR_Elbow: "51", centerToEnd_Tee: "38",
    length: "38", height: "38", stubEndLength: "51", stubEndLengthShort: "25",
    schedules: { "SCH 40 (STD)": "3.38", "SCH 80 (XS)": "4.55", "SCH 160": "6.35", "SCH XXS": "9.09" }
  },
  "1 1/4\"": { 
    od: "42.2", 
    centerToEnd_90_LR_Elbow: "48", centerToEnd_45_Elbow: "25", centerToEnd_45_LR_Elbow: "25", centerToEnd_90_SR_Elbow: "32", centerToEnd_45_SR_Elbow: "13", centerToCenter_180_LR_Elbow: "95", centerToCenter_180_SR_Elbow: "64", centerToEnd_Tee: "48",
    length: "51", height: "38", stubEndLength: "51", stubEndLengthShort: "32",
    schedules: { "SCH 40 (STD)": "3.56", "SCH 80 (XS)": "4.85", "SCH 160": "6.35", "SCH XXS": "9.70" }
  },
  "1 1/2\"": { 
    od: "48.3", 
    centerToEnd_90_LR_Elbow: "57", centerToEnd_45_Elbow: "29", centerToEnd_45_LR_Elbow: "29", centerToEnd_90_SR_Elbow: "38", centerToEnd_45_SR_Elbow: "16", centerToCenter_180_LR_Elbow: "114", centerToCenter_180_SR_Elbow: "76", centerToEnd_Tee: "57",
    length: "64", height: "38", stubEndLength: "51", stubEndLengthShort: "38",
    schedules: { "SCH 40 (STD)": "3.68", "SCH 80 (XS)": "5.08", "SCH 160": "7.14", "SCH XXS": "10.15" }
  },
  "2\"": { 
    od: "60.3", 
    centerToEnd_90_LR_Elbow: "76", centerToEnd_45_Elbow: "35", centerToEnd_45_LR_Elbow: "35", centerToEnd_90_SR_Elbow: "51", centerToEnd_45_SR_Elbow: "21", centerToCenter_180_LR_Elbow: "152", centerToCenter_180_SR_Elbow: "102", centerToEnd_Tee: "64",
    length: "76", height: "38", stubEndLength: "64", stubEndLengthShort: "44",
    schedules: { "SCH 40 (STD)": "3.91", "SCH 80 (XS)": "5.54", "SCH 160": "8.74", "SCH XXS": "11.07" }
  },
  "2 1/2\"": { 
    od: "73.0", 
    centerToEnd_90_LR_Elbow: "95", centerToEnd_45_Elbow: "44", centerToEnd_45_LR_Elbow: "44", centerToEnd_90_SR_Elbow: "64", centerToEnd_45_SR_Elbow: "26", centerToCenter_180_LR_Elbow: "190", centerToCenter_180_SR_Elbow: "127", centerToEnd_Tee: "76",
    length: "89", height: "38", stubEndLength: "76", stubEndLengthShort: "51",
    schedules: { "SCH 40 (STD)": "5.16", "SCH 80 (XS)": "7.01", "SCH 160": "9.53", "SCH XXS": "14.02" }
  },
  "3\"": { 
    od: "88.9", 
    centerToEnd_90_LR_Elbow: "114", centerToEnd_45_Elbow: "51", centerToEnd_45_LR_Elbow: "51", centerToEnd_90_SR_Elbow: "76", centerToEnd_45_SR_Elbow: "32", centerToCenter_180_LR_Elbow: "229", centerToCenter_180_SR_Elbow: "152", centerToEnd_Tee: "86",
    length: "89", height: "51", stubEndLength: "89", stubEndLengthShort: "51",
    schedules: { "SCH 40 (STD)": "5.49", "SCH 80 (XS)": "7.62", "SCH 160": "11.13", "SCH XXS": "15.24" }
  },
  "3 1/2\"": { 
    od: "101.6", 
    centerToEnd_90_LR_Elbow: "133", centerToEnd_45_Elbow: "57", centerToEnd_45_LR_Elbow: "57", centerToEnd_90_SR_Elbow: "89", centerToEnd_45_SR_Elbow: "37", centerToCenter_180_LR_Elbow: "267", centerToCenter_180_SR_Elbow: "178", centerToEnd_Tee: "95",
    length: "102", height: "64", stubEndLength: "102", stubEndLengthShort: "51",
    schedules: { "SCH 40 (STD)": "6.02", "SCH 80 (XS)": "8.56" }
  },
  "4\"": { 
    od: "114.3", 
    centerToEnd_90_LR_Elbow: "152", centerToEnd_45_Elbow: "64", centerToEnd_45_LR_Elbow: "64", centerToEnd_90_SR_Elbow: "102", centerToEnd_45_SR_Elbow: "42", centerToCenter_180_LR_Elbow: "305", centerToCenter_180_SR_Elbow: "203", centerToEnd_Tee: "105",
    length: "102", height: "64", stubEndLength: "102", stubEndLengthShort: "51",
    schedules: { "SCH 40 (STD)": "6.02", "SCH 80 (XS)": "8.56", "SCH 120": "11.13", "SCH 160": "13.49", "SCH XXS": "17.12" }
  },
  "5\"": { 
    od: "141.3", 
    centerToEnd_90_LR_Elbow: "190", centerToEnd_45_Elbow: "79", centerToEnd_45_LR_Elbow: "79", centerToEnd_90_SR_Elbow: "127", centerToEnd_45_SR_Elbow: "53", centerToCenter_180_LR_Elbow: "381", centerToCenter_180_SR_Elbow: "254", centerToEnd_Tee: "124", stubEndLength: "127", stubEndLengthShort: "76",
    schedules: { "SCH 40 (STD)": "6.55", "SCH 80 (XS)": "9.53", "SCH 120": "12.7", "SCH 160": "15.88", "SCH XXS": "19.05" }
  },
  "6\"": { 
    od: "168.3", 
    centerToEnd_90_LR_Elbow: "229", centerToEnd_45_Elbow: "95", centerToEnd_45_LR_Elbow: "95", centerToEnd_90_SR_Elbow: "152", centerToEnd_45_SR_Elbow: "63", centerToCenter_180_LR_Elbow: "457", centerToCenter_180_SR_Elbow: "305", centerToEnd_Tee: "143",
    length: "140", height: "89", stubEndLength: "140", stubEndLengthShort: "89",
    schedules: { "SCH 40 (STD)": "7.11", "SCH 80 (XS)": "10.97", "SCH 120": "14.27", "SCH 160": "18.26", "SCH XXS": "21.95" }
  },
  "8\"": { 
    od: "219.1", 
    centerToEnd_90_LR_Elbow: "305", centerToEnd_45_Elbow: "127", centerToEnd_45_LR_Elbow: "127", centerToEnd_90_SR_Elbow: "203", centerToEnd_45_SR_Elbow: "84", centerToCenter_180_LR_Elbow: "610", centerToCenter_180_SR_Elbow: "406", centerToEnd_Tee: "178",
    length: "152", height: "102", stubEndLength: "152", stubEndLengthShort: "102",
    schedules: { "SCH 20": "6.35", "SCH 30": "7.04", "SCH 40 (STD)": "8.18", "SCH 60": "10.31", "SCH 80 (XS)": "12.7", "SCH 100": "15.09", "SCH 120": "18.26", "SCH 140": "20.62", "SCH 160": "23.01", "SCH XXS": "22.23" }
  },
  "10\"": { 
    od: "273.0", 
    centerToEnd_90_LR_Elbow: "381", centerToEnd_45_Elbow: "159", centerToEnd_45_LR_Elbow: "159", centerToEnd_90_SR_Elbow: "254", centerToEnd_45_SR_Elbow: "105", centerToCenter_180_LR_Elbow: "762", centerToCenter_180_SR_Elbow: "508", centerToEnd_Tee: "216", stubEndLength: "152", stubEndLengthShort: "127",
    length: "127", height: "127",
    schedules: { "SCH 20": "6.35", "SCH 30": "7.8", "SCH 40 (STD)": "9.27", "SCH 60": "12.7", "SCH 80 (XS)": "15.09", "SCH 100": "18.26", "SCH 120": "21.44", "SCH 140": "25.4", "SCH 160": "28.58", "SCH XXS": "25.4" }
  },
  "12\"": { 
    od: "323.8", 
    centerToEnd_90_LR_Elbow: "457", centerToEnd_45_Elbow: "190", centerToEnd_45_LR_Elbow: "190", centerToEnd_90_SR_Elbow: "305", centerToEnd_45_SR_Elbow: "126", centerToCenter_180_LR_Elbow: "914", centerToCenter_180_SR_Elbow: "610", centerToEnd_Tee: "254", stubEndLength: "152", stubEndLengthShort: "127",
    length: "152", height: "152",
    schedules: { "SCH 20": "6.35", "SCH 30": "8.38", "SCH 40 (STD)": "9.53", "SCH 60": "14.27", "SCH 80 (XS)": "17.48", "SCH 100": "21.44", "SCH 120": "25.4", "SCH 140": "28.58", "SCH 160": "33.32", "SCH XXS": "25.4" }
  },
  "14\"": { 
    od: "355.6", 
    centerToEnd_90_LR_Elbow: "533", centerToEnd_45_Elbow: "222", centerToEnd_45_LR_Elbow: "222", centerToEnd_90_SR_Elbow: "356", centerToEnd_45_SR_Elbow: "147", centerToCenter_180_LR_Elbow: "1067", centerToCenter_180_SR_Elbow: "712", centerToEnd_Tee: "279", stubEndLength: "152", stubEndLengthShort: "127",
    length: "165", height: "165",
    schedules: { "SCH 10": "6.35", "SCH 20": "7.92", "SCH 30": "9.53", "SCH 40 (STD)": "11.13", "SCH 60": "15.09", "SCH 80 (XS)": "19.05", "SCH 100": "23.83", "SCH 120": "27.79", "SCH 140": "31.75", "SCH 160": "35.71" }
  },
  "16\"": { 
    od: "406.4", 
    centerToEnd_90_LR_Elbow: "610", centerToEnd_45_Elbow: "254", centerToEnd_45_LR_Elbow: "254", centerToEnd_90_SR_Elbow: "406", centerToEnd_45_SR_Elbow: "168", centerToCenter_180_LR_Elbow: "1219", centerToCenter_180_SR_Elbow: "813", centerToEnd_Tee: "305", stubEndLength: "152", stubEndLengthShort: "127",
    length: "178", height: "178",
    schedules: { "SCH 10": "6.35", "SCH 20": "9.53", "SCH 30": "12.7", "SCH 40 (STD)": "12.7", "SCH 60": "16.66", "SCH 80 (XS)": "21.44", "SCH 100": "26.19", "SCH 120": "30.96", "SCH 140": "36.53", "SCH 160": "40.49" }
  },
  "18\"": { 
    od: "457.2", 
    centerToEnd_90_LR_Elbow: "686", centerToEnd_45_Elbow: "286", centerToEnd_45_LR_Elbow: "286", centerToEnd_90_SR_Elbow: "457", centerToEnd_45_SR_Elbow: "189", centerToCenter_180_LR_Elbow: "1372", centerToCenter_180_SR_Elbow: "914", centerToEnd_Tee: "343", stubEndLength: "152", stubEndLengthShort: "152",
    length: "203", height: "203",
    schedules: { "SCH 10": "6.35", "SCH 20": "11.13", "SCH 30": "12.7", "SCH 40 (STD)": "12.7", "SCH 60": "19.05", "SCH 80 (XS)": "23.83", "SCH 100": "29.36", "SCH 120": "34.93", "SCH 140": "39.67", "SCH 160": "45.24" }
  },
  "20\"": { 
    od: "508.0", 
    centerToEnd_90_LR_Elbow: "762", centerToEnd_45_Elbow: "318", centerToEnd_45_LR_Elbow: "318", centerToEnd_90_SR_Elbow: "508", centerToEnd_45_SR_Elbow: "210", centerToCenter_180_LR_Elbow: "1524", centerToCenter_180_SR_Elbow: "1016", centerToEnd_Tee: "381", stubEndLength: "152", stubEndLengthShort: "152",
    length: "229", height: "229",
    schedules: { "SCH 10": "635", "SCH 20": "12.7", "SCH 30": "12.7", "SCH 40 (STD)": "12.7", "SCH 60": "22.23", "SCH 80 (XS)": "26.19", "SCH 100": "32.54", "SCH 120": "38.1", "SCH 140": "44.45", "SCH 160": "50.01" }
  },
  "24\"": { 
    od: "609.6", 
    centerToEnd_90_LR_Elbow: "914", centerToEnd_45_Elbow: "381", centerToEnd_45_LR_Elbow: "381", centerToEnd_90_SR_Elbow: "610", centerToEnd_45_SR_Elbow: "252", centerToCenter_180_LR_Elbow: "1829", centerToCenter_180_SR_Elbow: "1219", centerToEnd_Tee: "432", stubEndLength: "152", stubEndLengthShort: "152",
    length: "267", height: "267",
    schedules: { "SCH 10": "6.35", "SCH 20": "12.7", "SCH 30": "12.7", "SCH 40 (STD)": "12.7", "SCH 60": "24.61", "SCH 80 (XS)": "30.96", "SCH 100": "38.89", "SCH 120": "46.02", "SCH 140": "52.37", "SCH 160": "59.54" }
  }
};

export const FORGED_FITTING_STANDARDS: Record<string, any> = {
  "1/8\"": {
    od: "10.3",
    "2000": { hub_od: "22", wt: "3.18", height: "19", thd_elbow_tee_cross_c2center: "21", thd_45_elbow_c2center: "17", thd_coupling_length: "32", thd_cap_height: "19", thd_street_elbow_c2e: "26", plug_length: "11", bushing_length: "10" },
    "3000": { hub_od: "22", wt: "3.18", height: "19", sw_elbow_tee_cross_c2center: "21", sw_45_elbow_c2center: "17", sw_coupling_length: "32", sw_cap_height: "19", thd_elbow_tee_cross_c2center: "21", thd_45_elbow_c2center: "17", thd_coupling_length: "32", thd_cap_height: "19", thd_street_elbow_c2e: "26", olet_height: "19", plug_length: "11", bushing_length: "10" },
    "6000": { hub_od: "25", wt: "6.35", height: "25", sw_elbow_tee_cross_c2center: "25", sw_45_elbow_c2center: "19", sw_coupling_length: "32", sw_cap_height: "25", thd_elbow_tee_cross_c2center: "25", thd_45_elbow_c2center: "19", thd_coupling_length: "32", thd_cap_height: "25", thd_street_elbow_c2e: "32", olet_height: "25", plug_length: "11", bushing_length: "10" }
  },
  "1/4\"": {
    od: "13.7",
    "2000": { hub_od: "25", wt: "3.18", height: "25", thd_elbow_tee_cross_c2center: "21", thd_45_elbow_c2center: "17", thd_coupling_length: "35", thd_cap_height: "25", plug_length: "13", bushing_length: "11" },
    "3000": { hub_od: "25", wt: "3.30", height: "25", sw_elbow_tee_cross_c2center: "21", sw_45_elbow_c2center: "17", sw_coupling_length: "35", sw_cap_height: "25", thd_elbow_tee_cross_c2center: "25", thd_45_elbow_c2center: "19", thd_coupling_length: "35", thd_cap_height: "25", olet_height: "19", plug_length: "13", bushing_length: "11" },
    "6000": { hub_od: "33", wt: "6.60", height: "27", sw_elbow_tee_cross_c2center: "25", sw_45_elbow_c2center: "19", sw_coupling_length: "35", sw_cap_height: "27", thd_elbow_tee_cross_c2center: "28", thd_45_elbow_c2center: "22", thd_coupling_length: "43", thd_cap_height: "27", olet_height: "25", plug_length: "13", bushing_length: "11" }
  },
  "3/8\"": {
    od: "17.1",
    "2000": { hub_od: "33", wt: "3.18", height: "25", thd_elbow_tee_cross_c2center: "25", thd_45_elbow_c2center: "19", thd_coupling_length: "38", thd_cap_height: "25", plug_length: "14", bushing_length: "13" },
    "3000": { hub_od: "33", wt: "3.51", height: "25", sw_elbow_tee_cross_c2center: "25", sw_45_elbow_c2center: "19", sw_coupling_length: "38", sw_cap_height: "25", thd_elbow_tee_cross_c2center: "28", thd_45_elbow_c2center: "22", thd_coupling_length: "38", thd_cap_height: "25", olet_height: "21", plug_length: "14" },
    "6000": { hub_od: "38", wt: "6.98", height: "27", sw_elbow_tee_cross_c2center: "28", sw_45_elbow_c2center: "22", sw_coupling_length: "38", sw_cap_height: "27", thd_elbow_tee_cross_c2center: "33", thd_45_elbow_c2center: "25", thd_coupling_length: "48", thd_cap_height: "27", olet_height: "28", plug_length: "14" }
  },
  "1/2\"": {
    od: "21.3",
    "2000": { hub_od: "33", wt: "3.18", height: "32", thd_elbow_tee_cross_c2center: "28", thd_45_elbow_c2center: "22", thd_coupling_length: "48", thd_cap_height: "32", thd_street_elbow_c2e: "41", plug_length: "11", bushing_length: "11" },
    "3000": { hub_od: "33", wt: "4.09", height: "32", sw_elbow_tee_cross_c2center: "33", sw_45_elbow_c2center: "24", sw_coupling_length: "48", sw_cap_height: "32", thd_elbow_tee_cross_c2center: "33", thd_45_elbow_c2center: "25", thd_coupling_length: "48", thd_cap_height: "32", thd_street_elbow_c2e: "41", olet_height: "25", plug_length: "11", bushing_length: "11" },
    "6000": { hub_od: "46", wt: "8.18", height: "34", sw_elbow_tee_cross_c2center: "38", sw_45_elbow_c2center: "28", sw_coupling_length: "48", sw_cap_height: "34", thd_elbow_tee_cross_c2center: "38", thd_45_elbow_c2center: "33", thd_coupling_length: "51", thd_cap_height: "34", thd_street_elbow_c2e: "44", olet_height: "32", plug_length: "11", bushing_length: "11" },
    "9000": { hub_od: "46", wt: "8.18", height: "34", sw_elbow_tee_cross_c2center: "38", sw_45_elbow_c2center: "28", sw_coupling_length: "48", sw_cap_height: "34", olet_height: "32" }
  },
  "3/4\"": {
    od: "26.7",
    "2000": { hub_od: "38", wt: "3.18", height: "37", thd_elbow_tee_cross_c2center: "33", thd_45_elbow_c2center: "25", thd_coupling_length: "51", thd_cap_height: "37", plug_length: "16", bushing_length: "16" },
    "3000": { hub_od: "38", wt: "4.32", height: "37", sw_elbow_tee_cross_c2center: "38", sw_45_elbow_c2center: "28", sw_coupling_length: "51", sw_cap_height: "37", thd_elbow_tee_cross_c2center: "38", thd_45_elbow_c2center: "33", thd_coupling_length: "51", thd_cap_height: "37", olet_height: "27", plug_length: "16", bushing_length: "16" },
    "6000": { hub_od: "56", wt: "8.53", height: "41", sw_elbow_tee_cross_c2center: "44", sw_45_elbow_c2center: "33", sw_coupling_length: "51", sw_cap_height: "41", thd_elbow_tee_cross_c2center: "44", thd_45_elbow_c2center: "38", thd_coupling_length: "57", thd_cap_height: "41", olet_height: "37", plug_length: "16", bushing_length: "16" },
    "9000": { hub_od: "56", wt: "8.53", height: "41", sw_elbow_tee_cross_c2center: "44", sw_45_elbow_c2center: "33", sw_coupling_length: "51", sw_cap_height: "41", olet_height: "37" }
  },
  "1\"": {
    od: "33.4",
    "2000": { hub_od: "46", wt: "3.68", height: "41", thd_elbow_tee_cross_c2center: "38", thd_45_elbow_c2center: "28", thd_coupling_length: "60", thd_cap_height: "41", plug_length: "19", bushing_length: "19" },
    "3000": { hub_od: "46", wt: "4.98", height: "41", sw_elbow_tee_cross_c2center: "44", sw_45_elbow_c2center: "33", sw_coupling_length: "60", sw_cap_height: "41", thd_elbow_tee_cross_c2center: "44", thd_45_elbow_c2center: "35", thd_coupling_length: "60", thd_cap_height: "41", olet_height: "33", plug_length: "19", bushing_length: "19" },
    "6000": { hub_od: "62", wt: "9.93", height: "44", sw_elbow_tee_cross_c2center: "51", sw_45_elbow_c2center: "35", sw_coupling_length: "60", sw_cap_height: "44", thd_elbow_tee_cross_c2center: "51", thd_45_elbow_c2center: "44", thd_coupling_length: "64", thd_cap_height: "44", olet_height: "40", plug_length: "19", bushing_length: "19" },
    "9000": { hub_od: "62", wt: "9.93", height: "44", sw_elbow_tee_cross_c2center: "51", sw_45_elbow_c2center: "35", sw_coupling_length: "60", sw_cap_height: "44", olet_height: "40" }
  },
  "1 1/4\"": {
    od: "42.2",
    "2000": { hub_od: "56", wt: "3.89", height: "44", thd_elbow_tee_cross_c2center: "44", thd_45_elbow_c2center: "33", thd_coupling_length: "67", thd_cap_height: "44" },
    "3000": { hub_od: "56", wt: "5.28", height: "44", sw_elbow_tee_cross_c2center: "51", sw_45_elbow_c2center: "35", sw_coupling_length: "67", sw_cap_height: "44", thd_elbow_tee_cross_c2center: "51", thd_45_elbow_c2center: "43", thd_coupling_length: "67", thd_cap_height: "44" },
    "6000": { hub_od: "75", wt: "10.59", height: "48", sw_elbow_tee_cross_c2center: "64", sw_45_elbow_c2center: "43", sw_coupling_length: "67", sw_cap_height: "48", thd_elbow_tee_cross_c2center: "60", thd_45_elbow_c2center: "52", thd_coupling_length: "76", thd_cap_height: "48" },
    "9000": { hub_od: "75", wt: "10.59", height: "48", sw_elbow_tee_cross_c2center: "64", sw_45_elbow_c2center: "43", sw_coupling_length: "67", sw_cap_height: "48" }
  },
  "1 1/2\"": {
    od: "48.3",
    "2000": { hub_od: "62", wt: "4.01", height: "44", thd_elbow_tee_cross_c2center: "51", thd_45_elbow_c2center: "35", thd_coupling_length: "79", thd_cap_height: "44" },
    "3000": { hub_od: "62", wt: "5.54", height: "44", sw_elbow_tee_cross_c2center: "64", sw_45_elbow_c2center: "43", sw_coupling_length: "79", sw_cap_height: "44", thd_elbow_tee_cross_c2center: "60", thd_45_elbow_c2center: "52", thd_coupling_length: "79", thd_cap_height: "44" },
    "6000": { hub_od: "84", wt: "11.07", height: "48", sw_elbow_tee_cross_c2center: "83", sw_45_elbow_c2center: "52", sw_coupling_length: "79", sw_cap_height: "48", thd_elbow_tee_cross_c2center: "67", thd_45_elbow_c2center: "64", thd_coupling_length: "86", thd_cap_height: "48" },
    "9000": { hub_od: "84", wt: "11.07", height: "48", sw_elbow_tee_cross_c2center: "83", sw_45_elbow_c2center: "52", sw_coupling_length: "79", sw_cap_height: "48" }
  },
  "2\"": {
    od: "60.3",
    "2000": { hub_od: "75", wt: "4.27", height: "48", thd_elbow_tee_cross_c2center: "60", thd_45_elbow_c2center: "43", thd_coupling_length: "86", thd_cap_height: "48" },
    "3000": { hub_od: "75", wt: "6.07", height: "48", sw_elbow_tee_cross_c2center: "83", sw_45_elbow_c2center: "52", sw_coupling_length: "86", sw_cap_height: "48", thd_elbow_tee_cross_c2center: "67", thd_45_elbow_c2center: "64", thd_coupling_length: "86", thd_cap_height: "48" },
    "6000": { hub_od: "102", wt: "12.12", height: "60", sw_elbow_tee_cross_c2center: "95", sw_45_elbow_c2center: "64", sw_coupling_length: "86", sw_cap_height: "60", thd_elbow_tee_cross_c2center: "83", thd_45_elbow_c2center: "79", thd_coupling_length: "92", thd_cap_height: "60" },
    "9000": { hub_od: "102", wt: "12.12", height: "60", sw_elbow_tee_cross_c2center: "95", sw_45_elbow_c2center: "64", sw_coupling_length: "86", sw_cap_height: "60" }
  },
  "2 1/2\"": {
    od: "73.0",
    "2000": { hub_od: "92", wt: "5.61", height: "60", thd_elbow_tee_cross_c2center: "76", thd_45_elbow_c2center: "52", thd_coupling_length: "92", thd_cap_height: "60" },
    "3000": { hub_od: "92", wt: "7.67", height: "60", sw_elbow_tee_cross_c2center: "95", sw_45_elbow_c2center: "64", sw_coupling_length: "92", sw_cap_height: "60", thd_elbow_tee_cross_c2center: "83", thd_45_elbow_c2center: "79", thd_coupling_length: "92", thd_cap_height: "60" },
    "6000": { hub_od: "121", wt: "15.29", height: "67", sw_elbow_tee_cross_c2center: "108", sw_45_elbow_c2center: "79", sw_coupling_length: "92", sw_cap_height: "67", thd_elbow_tee_cross_c2center: "95", thd_45_elbow_c2center: "83", thd_coupling_length: "108", thd_cap_height: "67" },
    "9000": { hub_od: "121", wt: "15.29", height: "67", sw_elbow_tee_cross_c2center: "108", sw_45_elbow_c2center: "79", sw_coupling_length: "92", sw_cap_height: "67" }
  },
  "3\"": {
    od: "88.9",
    "2000": { hub_od: "108", wt: "5.99", height: "67", thd_elbow_tee_cross_c2center: "86", thd_45_elbow_c2center: "64", thd_coupling_length: "108", thd_cap_height: "67" },
    "3000": { hub_od: "108", wt: "8.31", height: "67", sw_elbow_tee_cross_c2center: "108", sw_45_elbow_c2center: "79", sw_coupling_length: "108", sw_cap_height: "67", thd_elbow_tee_cross_c2center: "95", thd_45_elbow_c2center: "83", thd_coupling_length: "108", thd_cap_height: "67" },
    "6000": { hub_od: "146", wt: "16.64", height: "76", sw_elbow_tee_cross_c2center: "121", sw_45_elbow_c2center: "83", sw_coupling_length: "108", sw_cap_height: "76", thd_elbow_tee_cross_c2center: "108", thd_45_elbow_c2center: "95", thd_coupling_length: "121", thd_cap_height: "76" },
    "9000": { hub_od: "146", wt: "16.64", height: "76", sw_elbow_tee_cross_c2center: "121", sw_45_elbow_c2center: "83", sw_coupling_length: "108", sw_cap_height: "76" }
  },
  "4\"": {
    od: "114.3",
    "2000": { hub_od: "140", wt: "6.60", height: "76", thd_elbow_tee_cross_c2center: "105", thd_45_elbow_c2center: "79", thd_coupling_length: "121", thd_cap_height: "76" },
    "3000": { hub_od: "140", wt: "9.35", height: "76", sw_elbow_tee_cross_c2center: "127", sw_45_elbow_c2center: "89", sw_coupling_length: "121", sw_cap_height: "76", thd_elbow_tee_cross_c2center: "114", thd_45_elbow_c2center: "102", thd_coupling_length: "121", thd_cap_height: "76" },
    "6000": { hub_od: "178", wt: "18.67", height: "83", sw_elbow_tee_cross_c2center: "152", sw_45_elbow_c2center: "102", sw_coupling_length: "121", sw_cap_height: "83", thd_elbow_tee_cross_c2center: "121", thd_45_elbow_c2center: "114", thd_coupling_length: "152", thd_cap_height: "83" },
    "9000": { hub_od: "178", wt: "18.67", height: "83", sw_elbow_tee_cross_c2center: "152", sw_45_elbow_c2center: "102", sw_coupling_length: "121", sw_cap_height: "83" }
  }
};
