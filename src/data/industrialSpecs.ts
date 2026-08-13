export interface FlangeSpecs {
  size: string;
  class: number;
  type: string; // WNRF, SORF, BLRF, etc.
  od: number; // Outside Diameter (inch)
  od_mm: number;
  thickness: number; // Thickness (inch)
  thickness_mm: number;
  pcd: number; // Pitch Circle Diameter (inch)
  pcd_mm: number;
  holes: number; // Number of holes
  holeSize: number; // Hole Size (inch)
  holeSize_mm: number;
  id?: number; // Internal Diameter / Bore (inch)
  id_mm?: number;
  hubLarge?: number; // Hub Diameter at base (inch)
  hubLarge_mm?: number;
  hubSmall?: number; // Hub Diameter at welding end (inch)
  hubSmall_mm?: number;
  hubLength?: number; // Length through hub (inch)
  hubLength_mm?: number;
  rfDiameter?: number; // Raised Face Diameter (inch)
  rfDiameter_mm?: number;
  weight: number; // Weight (kg approx)
}

export const ASME_B16_5_FLANGE_DATA: FlangeSpecs[] = [
  // Class 150
  { 
    size: "1/2\"", class: 150, type: "WNRF", 
    od: 3.5, od_mm: 88.9, thickness: 0.44, thickness_mm: 11.2, pcd: 2.38, pcd_mm: 60.5, 
    holes: 4, holeSize: 0.62, holeSize_mm: 15.7, id: 0.62, id_mm: 15.8,
    hubLarge: 1.19, hubLarge_mm: 30.2, hubSmall: 0.84, hubSmall_mm: 21.3,
    hubLength: 1.88, hubLength_mm: 47.8, rfDiameter: 1.38, rfDiameter_mm: 35.1, weight: 0.84 
  },
  { 
    size: "1/2\"", class: 150, type: "SORF", 
    od: 3.5, od_mm: 88.9, thickness: 0.44, thickness_mm: 11.2, pcd: 2.38, pcd_mm: 60.5, 
    holes: 4, holeSize: 0.62, holeSize_mm: 15.7, id: 0.88, id_mm: 22.4,
    hubLarge: 1.19, hubLarge_mm: 30.2, hubSmall: 0.84, hubSmall_mm: 21.3,
    hubLength: 0.62, hubLength_mm: 15.7, rfDiameter: 1.38, rfDiameter_mm: 35.1, weight: 0.43 
  },
  { 
    size: "1\"", class: 150, type: "WNRF", 
    od: 4.25, od_mm: 108.0, thickness: 0.56, thickness_mm: 14.3, pcd: 3.12, pcd_mm: 79.4, 
    holes: 4, holeSize: 0.62, holeSize_mm: 15.7, id: 1.05, id_mm: 26.7,
    hubLarge: 1.94, hubLarge_mm: 49.3, hubSmall: 1.31, hubSmall_mm: 33.3,
    hubLength: 2.19, hubLength_mm: 55.6, rfDiameter: 2.0, rfDiameter_mm: 50.8, weight: 1.56 
  },
  { 
    size: "2\"", class: 150, type: "WNRF", 
    od: 6.0, od_mm: 152.4, thickness: 0.75, thickness_mm: 19.1, pcd: 4.75, pcd_mm: 120.7, 
    holes: 4, holeSize: 0.75, holeSize_mm: 19.1, id: 2.07, id_mm: 52.6,
    hubLarge: 3.06, hubLarge_mm: 77.7, hubSmall: 2.38, hubSmall_mm: 60.5,
    hubLength: 2.50, hubLength_mm: 63.5, rfDiameter: 3.62, rfDiameter_mm: 91.9, weight: 3.63 
  },
  { 
    size: "2\"", class: 150, type: "SORF", 
    od: 6.0, od_mm: 152.4, thickness: 0.75, thickness_mm: 19.1, pcd: 4.75, pcd_mm: 120.7, 
    holes: 4, holeSize: 0.75, holeSize_mm: 19.1, id: 2.44, id_mm: 62.0,
    hubLarge: 3.06, hubLarge_mm: 77.7, hubSmall: 2.38, hubSmall_mm: 60.5,
    hubLength: 1.0, hubLength_mm: 25.4, rfDiameter: 3.62, rfDiameter_mm: 91.9, weight: 2.36 
  },
  { 
    size: "3\"", class: 150, type: "WNRF", 
    od: 7.5, od_mm: 190.5, thickness: 0.94, thickness_mm: 23.9, pcd: 6.0, pcd_mm: 152.4, 
    holes: 4, holeSize: 0.75, holeSize_mm: 19.1, id: 3.07, id_mm: 77.9,
    hubLarge: 4.25, hubLarge_mm: 108.0, hubSmall: 3.5, hubSmall_mm: 88.9,
    hubLength: 2.75, hubLength_mm: 69.9, rfDiameter: 5.0, rfDiameter_mm: 127.0, weight: 7.30 
  },
  { 
    size: "4\"", class: 150, type: "WNRF", 
    od: 9.0, od_mm: 228.6, thickness: 0.94, thickness_mm: 23.9, pcd: 7.5, pcd_mm: 190.5, 
    holes: 8, holeSize: 0.75, holeSize_mm: 19.1, id: 4.03, id_mm: 102.3,
    hubLarge: 5.31, hubLarge_mm: 134.9, hubSmall: 4.5, hubSmall_mm: 114.3,
    hubLength: 3.0, hubLength_mm: 76.2, rfDiameter: 6.19, rfDiameter_mm: 157.2, weight: 11.82 
  },
  { 
    size: "4\"", class: 150, type: "WNRF", 
    od: 9.0, od_mm: 228.6, thickness: 0.94, thickness_mm: 23.9, pcd: 7.5, pcd_mm: 190.5, 
    holes: 8, holeSize: 0.75, holeSize_mm: 19.1, id: 4.03, id_mm: 102.4,
    hubLarge: 5.31, hubLarge_mm: 134.9, hubSmall: 4.5, hubSmall_mm: 114.3,
    hubLength: 3.0, hubLength_mm: 76.2, rfDiameter: 6.19, rfDiameter_mm: 157.2, weight: 11.82 
  },
  { 
    size: "4\"", class: 150, type: "SORF", 
    od: 9.0, od_mm: 228.6, thickness: 0.94, thickness_mm: 23.9, pcd: 7.5, pcd_mm: 190.5, 
    holes: 8, holeSize: 0.75, holeSize_mm: 19.1, id: 4.57, id_mm: 116.1,
    hubLarge: 5.31, hubLarge_mm: 134.9, hubSmall: 4.5, hubSmall_mm: 114.3,
    hubLength: 1.31, hubLength_mm: 33.3, rfDiameter: 6.19, rfDiameter_mm: 157.2, weight: 7.18 
  },
  { 
    size: "6\"", class: 150, type: "WNRF", 
    od: 11.0, od_mm: 279.4, thickness: 1.0, thickness_mm: 25.4, pcd: 9.5, pcd_mm: 241.3, 
    holes: 8, holeSize: 0.88, holeSize_mm: 22.4, id: 6.07, id_mm: 154.2,
    hubLarge: 7.56, hubLarge_mm: 192.0, hubSmall: 6.62, hubSmall_mm: 168.1,
    hubLength: 3.5, hubLength_mm: 88.9, rfDiameter: 8.5, rfDiameter_mm: 215.9, weight: 20.91 
  },
  { 
    size: "6\"", class: 150, type: "SORF", 
    od: 11.0, od_mm: 279.4, thickness: 1.0, thickness_mm: 25.4, pcd: 9.5, pcd_mm: 241.3, 
    holes: 8, holeSize: 0.88, holeSize_mm: 22.4, id: 6.72, id_mm: 170.7,
    hubLarge: 7.56, hubLarge_mm: 192.0, hubSmall: 6.62, hubSmall_mm: 168.1,
    hubLength: 1.56, hubLength_mm: 39.6, rfDiameter: 8.5, rfDiameter_mm: 215.9, weight: 11.32 
  },
  { 
    size: "8\"", class: 150, type: "WNRF", 
    od: 13.5, od_mm: 342.9, thickness: 1.12, thickness_mm: 28.5, pcd: 11.75, pcd_mm: 298.5, 
    holes: 8, holeSize: 0.88, holeSize_mm: 22.4, id: 7.98, id_mm: 202.7,
    hubLarge: 9.69, hubLarge_mm: 246.1, hubSmall: 8.62, hubSmall_mm: 219.1,
    hubLength: 4.0, hubLength_mm: 101.6, rfDiameter: 10.62, rfDiameter_mm: 269.7, weight: 31.33 
  },
  { 
    size: "8\"", class: 300, type: "WNRF", 
    od: 15.0, od_mm: 381.0, thickness: 1.62, thickness_mm: 41.3, pcd: 13.0, pcd_mm: 330.2, 
    holes: 12, holeSize: 1.0, holeSize_mm: 25.4, id: 7.98, id_mm: 202.7,
    hubLarge: 10.62, hubLarge_mm: 269.9, hubSmall: 8.62, hubSmall_mm: 219.1,
    hubLength: 4.38, hubLength_mm: 111.1, rfDiameter: 10.62, rfDiameter_mm: 269.9, weight: 48.52 
  },
  { 
    size: "8\"", class: 600, type: "WNRF", 
    od: 16.5, od_mm: 419.1, thickness: 2.19, thickness_mm: 55.6, pcd: 13.75, pcd_mm: 349.3, 
    holes: 12, holeSize: 1.25, holeSize_mm: 31.8, id: 7.98, id_mm: 202.7,
    hubLarge: 11.75, hubLarge_mm: 298.5, hubSmall: 8.62, hubSmall_mm: 219.1,
    hubLength: 5.25, hubLength_mm: 133.4, rfDiameter: 10.62, rfDiameter_mm: 269.9, weight: 88.5 
  },
  { 
    size: "8\"", class: 150, type: "SORF", 
    od: 13.5, od_mm: 342.9, thickness: 1.12, thickness_mm: 28.5, pcd: 11.75, pcd_mm: 298.5, 
    holes: 8, holeSize: 0.88, holeSize_mm: 22.4, id: 8.72, id_mm: 221.5,
    hubLarge: 9.69, hubLarge_mm: 246.1, hubSmall: 8.62, hubSmall_mm: 219.1,
    hubLength: 1.75, hubLength_mm: 44.5, rfDiameter: 10.62, rfDiameter_mm: 269.7, weight: 18.22 
  },
  { 
    size: "8\"", class: 150, type: "WNRF", 
    od: 13.5, od_mm: 342.9, thickness: 1.12, thickness_mm: 28.6, pcd: 11.75, pcd_mm: 298.5, 
    holes: 8, holeSize: 0.88, holeSize_mm: 22.4, id: 7.98, id_mm: 202.7,
    hubLarge: 9.69, hubLarge_mm: 246.1, hubSmall: 8.62, hubSmall_mm: 219.1,
    hubLength: 4.0, hubLength_mm: 101.6, rfDiameter: 10.62, rfDiameter_mm: 269.7, weight: 31.33 
  },
  { 
    size: "10\"", class: 150, type: "WNRF", 
    od: 16.0, od_mm: 406.4, thickness: 1.19, thickness_mm: 30.2, pcd: 14.25, pcd_mm: 362.0, 
    holes: 12, holeSize: 1.0, holeSize_mm: 25.4, id: 10.02, id_mm: 254.5,
    hubLarge: 12.0, hubLarge_mm: 304.8, hubSmall: 10.75, hubSmall_mm: 273.0,
    hubLength: 4.0, hubLength_mm: 101.6, rfDiameter: 12.75, rfDiameter_mm: 323.8, weight: 44.52 
  },
  { 
    size: "10\"", class: 300, type: "WNRF", 
    od: 17.5, od_mm: 444.5, thickness: 1.88, thickness_mm: 47.8, pcd: 15.25, pcd_mm: 387.4, 
    holes: 16, holeSize: 1.12, holeSize_mm: 28.4, id: 10.02, id_mm: 254.5,
    hubLarge: 13.5, hubLarge_mm: 342.9, hubSmall: 10.75, hubSmall_mm: 273.0,
    hubLength: 4.62, hubLength_mm: 117.3, rfDiameter: 12.75, rfDiameter_mm: 323.8, weight: 118.84 
  },
  { 
    size: "10\"", class: 600, type: "WNRF", 
    od: 20.0, od_mm: 508.0, thickness: 2.5, thickness_mm: 63.5, pcd: 17.0, pcd_mm: 431.8, 
    holes: 16, holeSize: 1.38, holeSize_mm: 35.0, id: 10.02, id_mm: 254.5,
    hubLarge: 14.5, hubLarge_mm: 368.3, hubSmall: 10.75, hubSmall_mm: 273.0,
    hubLength: 6.0, hubLength_mm: 152.4, rfDiameter: 12.75, rfDiameter_mm: 323.8, weight: 185.0 
  },
  { 
    size: "10\"", class: 150, type: "SORF", 
    od: 16.0, od_mm: 406.4, thickness: 1.19, thickness_mm: 30.2, pcd: 14.25, pcd_mm: 362.0, 
    holes: 12, holeSize: 1.0, holeSize_mm: 25.4, id: 10.88, id_mm: 276.4,
    hubLarge: 12.0, hubLarge_mm: 304.8, hubSmall: 10.75, hubSmall_mm: 273.0,
    hubLength: 1.94, hubLength_mm: 49.3, rfDiameter: 12.75, rfDiameter_mm: 323.8, weight: 24.81 
  },
  { 
    size: "12\"", class: 150, type: "WNRF", 
    od: 19.0, od_mm: 482.6, thickness: 1.25, thickness_mm: 31.8, pcd: 17.0, pcd_mm: 431.8, 
    holes: 12, holeSize: 1.0, holeSize_mm: 25.4, id: 12.0, id_mm: 304.8,
    hubLarge: 14.38, hubLarge_mm: 365.3, hubSmall: 12.75, hubSmall_mm: 323.9,
    hubLength: 4.5, hubLength_mm: 114.3, rfDiameter: 15.0, rfDiameter_mm: 381.0, weight: 67.54 
  },
  { 
    size: "12\"", class: 300, type: "WNRF", 
    od: 20.5, od_mm: 520.7, thickness: 2.0, thickness_mm: 50.8, pcd: 17.75, pcd_mm: 450.8, 
    holes: 16, holeSize: 1.25, holeSize_mm: 31.8, id: 12.0, id_mm: 304.8,
    hubLarge: 16.0, hubLarge_mm: 406.4, hubSmall: 12.75, hubSmall_mm: 323.9,
    hubLength: 5.12, hubLength_mm: 130.2, rfDiameter: 15.0, rfDiameter_mm: 381.0, weight: 115.4 
  },
  { 
    size: "12\"", class: 600, type: "WNRF", 
    od: 22.0, od_mm: 558.8, thickness: 2.62, thickness_mm: 66.7, pcd: 19.25, pcd_mm: 489.0, 
    holes: 20, holeSize: 1.38, holeSize_mm: 35.0, id: 12.0, id_mm: 304.8,
    hubLarge: 16.5, hubLarge_mm: 419.1, hubSmall: 12.75, hubSmall_mm: 323.9,
    hubLength: 6.12, hubLength_mm: 155.6, rfDiameter: 15.0, rfDiameter_mm: 381.0, weight: 195.4 
  },

  // Class 300
  { 
    size: "1/2\"", class: 300, type: "WNRF", 
    od: 3.75, od_mm: 95.3, thickness: 0.56, thickness_mm: 14.3, pcd: 2.62, pcd_mm: 66.5, 
    holes: 4, holeSize: 0.62, holeSize_mm: 15.7, id: 0.62, id_mm: 15.8,
    hubLarge: 1.5, hubLarge_mm: 38.1, hubSmall: 0.84, hubSmall_mm: 21.3,
    hubLength: 2.06, hubLength_mm: 52.3, rfDiameter: 1.38, rfDiameter_mm: 35.1, weight: 1.22 
  },
  { 
    size: "2\"", class: 300, type: "WNRF", 
    od: 6.5, od_mm: 165.1, thickness: 0.81, thickness_mm: 20.6, pcd: 5.0, pcd_mm: 127.0, 
    holes: 8, holeSize: 0.75, holeSize_mm: 19.1, id: 2.07, id_mm: 52.6,
    hubLarge: 3.31, hubLarge_mm: 84.1, hubSmall: 2.38, hubSmall_mm: 60.5,
    hubLength: 2.75, hubLength_mm: 69.9, rfDiameter: 3.62, rfDiameter_mm: 91.9, weight: 5.12 
  },
  { 
    size: "4\"", class: 300, type: "WNRF", 
    od: 10.0, od_mm: 254.0, thickness: 1.25, thickness_mm: 31.8, pcd: 7.88, pcd_mm: 200.0, 
    holes: 8, holeSize: 0.88, holeSize_mm: 22.4, id: 4.03, id_mm: 102.3,
    hubLarge: 5.75, hubLarge_mm: 146.1, hubSmall: 4.5, hubSmall_mm: 114.3,
    hubLength: 3.0, hubLength_mm: 76.2, rfDiameter: 6.19, rfDiameter_mm: 157.2, weight: 16.82 
  },
  { 
    size: "6\"", class: 300, type: "WNRF", 
    od: 12.5, od_mm: 317.5, thickness: 1.44, thickness_mm: 36.6, pcd: 10.62, pcd_mm: 269.9, 
    holes: 12, holeSize: 0.88, holeSize_mm: 22.4, id: 6.07, id_mm: 154.2,
    hubLarge: 8.31, hubLarge_mm: 211.1, hubSmall: 6.62, hubSmall_mm: 168.1,
    hubLength: 3.5, hubLength_mm: 88.9, rfDiameter: 8.5, rfDiameter_mm: 215.9, weight: 28.52 
  },
  { 
    size: "8\"", class: 300, type: "WNRF", 
    od: 15.0, od_mm: 381.0, thickness: 1.62, thickness_mm: 41.3, pcd: 13.0, pcd_mm: 330.2, 
    holes: 12, holeSize: 1.0, holeSize_mm: 25.4, id: 7.98, id_mm: 202.7,
    hubLarge: 10.62, hubLarge_mm: 269.9, hubSmall: 8.62, hubSmall_mm: 219.1,
    hubLength: 4.38, hubLength_mm: 111.1, rfDiameter: 10.62, rfDiameter_mm: 269.9, weight: 48.52 
  },
  { 
    size: "10\"", class: 300, type: "WNRF", 
    od: 17.5, od_mm: 444.5, thickness: 1.88, thickness_mm: 47.8, pcd: 15.25, pcd_mm: 387.4, 
    holes: 16, holeSize: 1.12, holeSize_mm: 28.4, id: 10.02, id_mm: 254.5,
    hubLarge: 13.5, hubLarge_mm: 342.9, hubSmall: 10.75, hubSmall_mm: 273.0,
    hubLength: 4.62, hubLength_mm: 117.3, rfDiameter: 12.75, rfDiameter_mm: 323.8, weight: 118.84 
  },
  { 
    size: "10\"", class: 300, type: "SORF", 
    od: 17.5, od_mm: 444.5, thickness: 1.88, thickness_mm: 47.8, pcd: 15.25, pcd_mm: 387.4, 
    holes: 16, holeSize: 1.12, holeSize_mm: 28.4, id: 10.88, id_mm: 276.4,
    hubLarge: 13.5, hubLarge_mm: 342.9, hubSmall: 10.75, hubSmall_mm: 273.0,
    hubLength: 2.62, hubLength_mm: 66.5, rfDiameter: 12.75, rfDiameter_mm: 323.8, weight: 75.3 
  },

  // Class 600
  { size: "1/2\"", class: 600, type: "WNRF", od: 3.75, od_mm: 95.3, thickness: 0.56, thickness_mm: 14.3, pcd: 2.62, pcd_mm: 66.5, holes: 4, holeSize: 0.62, holeSize_mm: 15.7, weight: 1.52 },
  { size: "3/4\"", class: 600, type: "WNRF", od: 4.62, od_mm: 117.3, thickness: 0.62, thickness_mm: 15.7, pcd: 3.25, pcd_mm: 82.6, holes: 4, holeSize: 0.75, holeSize_mm: 19.1, weight: 2.2 },
  { size: "1\"", class: 600, type: "WNRF", od: 4.88, od_mm: 124.0, thickness: 0.69, thickness_mm: 17.5, pcd: 3.5, pcd_mm: 88.9, holes: 4, holeSize: 0.75, holeSize_mm: 19.1, weight: 2.8 },
  { size: "2\"", class: 600, type: "WNRF", od: 6.5, od_mm: 165.1, thickness: 1.0, thickness_mm: 25.4, pcd: 5.0, pcd_mm: 127.0, holes: 8, holeSize: 0.75, holeSize_mm: 19.1, weight: 7.22 },
  { size: "3\"", class: 600, type: "WNRF", od: 8.25, od_mm: 209.6, thickness: 1.25, thickness_mm: 31.8, pcd: 6.62, pcd_mm: 168.1, holes: 8, holeSize: 0.88, holeSize_mm: 22.4, weight: 14.2 },
  { size: "4\"", class: 600, type: "WNRF", od: 10.75, od_mm: 273.1, thickness: 1.5, thickness_mm: 38.1, pcd: 8.5, pcd_mm: 215.9, holes: 8, holeSize: 1.0, holeSize_mm: 25.4, weight: 24.52 },
  { size: "6\"", class: 600, type: "WNRF", od: 14.0, od_mm: 355.6, thickness: 1.88, thickness_mm: 47.8, pcd: 11.5, pcd_mm: 292.1, holes: 12, holeSize: 1.12, holeSize_mm: 28.4, weight: 51.4 },
  { size: "8\"", class: 600, type: "WNRF", od: 16.5, od_mm: 419.1, thickness: 2.19, thickness_mm: 55.6, pcd: 13.75, pcd_mm: 349.3, holes: 12, holeSize: 1.25, holeSize_mm: 31.8, weight: 88.5 },
  { size: "12\"", class: 600, type: "WNRF", od: 22.0, od_mm: 558.8, thickness: 2.62, thickness_mm: 66.5, pcd: 19.25, pcd_mm: 489.0, holes: 20, holeSize: 1.38, holeSize_mm: 35.1, weight: 195.4 },
  { size: "24\"", class: 600, type: "WNRF", od: 37.0, od_mm: 939.8, thickness: 4.0, thickness_mm: 101.6, pcd: 33.0, pcd_mm: 838.2, holes: 24, holeSize: 2.0, holeSize_mm: 50.8, weight: 750.2 },

  // Class 900
  { size: "1/2\"", class: 900, type: "WNRF", od: 4.75, od_mm: 120.7, thickness: 0.88, thickness_mm: 22.4, pcd: 3.25, pcd_mm: 82.6, holes: 4, holeSize: 0.88, holeSize_mm: 22.4, weight: 4.54 },
  { size: "2\"", class: 900, type: "WNRF", od: 8.5, od_mm: 215.9, thickness: 1.5, thickness_mm: 38.1, pcd: 6.5, pcd_mm: 165.1, holes: 8, holeSize: 1.0, holeSize_mm: 25.4, weight: 20.41 },
  { size: "4\"", class: 900, type: "WNRF", od: 11.5, od_mm: 292.1, thickness: 1.75, thickness_mm: 44.5, pcd: 9.25, pcd_mm: 235.0, holes: 8, holeSize: 1.25, holeSize_mm: 31.8, weight: 45.36 },

  // Class 1500
  { size: "1/2\"", class: 1500, type: "WNRF", od: 4.75, od_mm: 120.7, thickness: 0.88, thickness_mm: 22.4, pcd: 3.25, pcd_mm: 82.6, holes: 4, holeSize: 0.88, holeSize_mm: 22.4, weight: 4.54 },
  { size: "2\"", class: 1500, type: "WNRF", od: 8.5, od_mm: 215.9, thickness: 1.5, thickness_mm: 38.1, pcd: 6.5, pcd_mm: 165.1, holes: 8, holeSize: 1.0, holeSize_mm: 25.4, weight: 20.41 },
  { size: "4\"", class: 1500, type: "WNRF", od: 12.25, od_mm: 311.2, thickness: 2.12, thickness_mm: 53.8, pcd: 9.5, pcd_mm: 241.3, holes: 8, holeSize: 1.38, holeSize_mm: 35.1, weight: 63.5 },

  // Class 2500
  { size: "1/2\"", class: 2500, type: "WNRF", od: 5.25, od_mm: 133.4, thickness: 1.19, thickness_mm: 30.2, pcd: 3.5, pcd_mm: 88.9, holes: 4, holeSize: 0.88, holeSize_mm: 22.4, weight: 7.26 },
  { size: "2\"", class: 2500, type: "WNRF", od: 9.25, od_mm: 235.0, thickness: 2.0, thickness_mm: 50.8, pcd: 6.75, pcd_mm: 171.5, holes: 8, holeSize: 1.12, holeSize_mm: 28.4, weight: 31.75 }
];
