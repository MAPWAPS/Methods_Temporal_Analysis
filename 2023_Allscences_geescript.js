// Load Sentinel-2 data for one year and select all bands
var sentinel2 = ee.ImageCollection("COPERNICUS/S2")
                .filterDate('2023-01-01', '2023-12-31') // Example for one year
                .filterBounds(ROI)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 0.1)); // Allow minimal cloud coverage
                
print('Sentinel-2 Collection:', sentinel2);

// Function to extract the month from the system:time_start property and add it as a property
var addMonth = function(image) {
  var month = ee.Date(image.get('system:time_start')).get('month');
  return image.set('month', month); // Add month as a property
};

// Apply the function to add month to each image
var sentinel2WithMonth = sentinel2.map(addMonth);

// Composite the images using the median
var composite = sentinel2WithMonth.median().select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12']);
print('Composite Image:', composite);

var uMzi_Clipped= composite.clip(ROI);
print(uMzi_Clipped, 'uMzi_Clipped')
print(uMzi_Clipped.bandNames(), 'Bands in uMzi_Clipped');
// Map.addLayer(uMzi_Clipped, TrueColour, 'Sentinel Image');

// Visualize the composite
Map.centerObject(ROI, 10);
Map.addLayer(uMzi_Clipped, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Sentinel-2 Composite');

var bands = ee.List(['B2', 'B3', 'B4',]) ;

Export.image.toDrive({
  image: uMzi_Clipped.select(bands),
  description: "S_2_uMzimvubuCatchment_DailyComposite",
  scale: 10,
  crs: 'EPSG:32735',
  region: ROI,
  maxPixels: 1e9,
})


// rescale image bands /10 000
var image = uMzi_Clipped.divide(10000)

// ADDING INDICIES 
//1.NDVI
var NDVI= image.expression('(NIR-RED)/(NIR+RED)' ,{
  'NIR': image.select('B8'),
  'RED': image.select('B4'),
}).rename('NDVI')

//2.Chlogreen (Chlorophyll Green Index)
var Chlogreen= image.expression('(NIRnarrow)/(Green+ REDedge1)' ,{
  'NIRnarrow': image.select('B8A'),
  'Green': image.select('B3'),
  'REDedge1': image.select('B5'),
}).rename('Chlogreen')

// 3 LAnthoC (Leaf Anthocynanid Content)
var LAnthoC= image.expression('(REDedge3)/(Green+ REDedge1)' ,{
  'REDedge3': image.select('B7'),
  'Green': image.select('B3'),
  'REDedge1': image.select('B5'),
}).rename('LAnthoC')

// 4  LChloC (Leaf Chlorophyll Content)
var LChloC= image.expression('(REDedge3)/(REDedge1)' ,{
  'REDedge3': image.select('B7'),
  'REDedge1': image.select('B5'),
}).rename('LChloC')

// 5 LCaroC (Leaf Carotenoid Content)
var LCaroC= image.expression('(REDedge3)/(Blue-REDedge1)' ,{
  'REDedge3': image.select('B7'),
  'Blue': image.select('B2'),
  'REDedge1': image.select('B5'),
}).rename('LCaroC')

// 6 BAI (Built-up Area Index)
var BAI= image.expression('(Blue-NIR)/(Blue+NIR)' ,{
  'Blue': image.select('B2'),
  'NIR': image.select('B8'),
  }).rename('BAI')
  
// 7 GI (Grazing index)
var GI= image.expression('(Green/Red)' ,{
  'Green': image.select('B3'),
  'Red': image.select('B4'),
  }).rename('GI')

// 8 gNDVI (Green Normalized Difference Vegetation)
var gNDVI= image.expression('(NIR-Green)/(NIR+Green)' ,{
  'Green': image.select('B3'),
  'NIR': image.select('B8'),
  }).rename('gNDVI')
 
// 9 MSI (Multispectral Instrument)
var MSI= image.expression('(SWIR1/NIR)' ,{
  'SWIR1': image.select('B11'),
  'NIR': image.select('B8'),
  }).rename('MSI')

// 10 NDrededgeSWIR
var NDrededgeSWIR= image.expression('(Rededge2 - SWIR2)/(Rededge2 + SWIR2)' ,{
  'Rededge2': image.select('B6'),
  'SWIR2': image.select('B12'),
  }).rename('NDrededgeSWIR')
  
 
// 11 NDTI (also referred to as NBR2-Normalized Difference Tillage Index)
var NDTI= image.expression('(SWIR1-SWIR2)/(SWIR1+SWIR2)' ,{
  'SWIR1': image.select('B11'),
  'SWIR2': image.select('B12'),
  }).rename('NDTI')

// 12 NDVIre (Red-edge normalized difference vegetation index)
var NDVIre= image.expression('(NIR-Rededge1)/(NIR+Rededge1)' ,{
  'NIR': image.select('B8'),
  'Rededge1': image.select('B5'),
  }).rename('NDVIre')
  
// 13 NDVI1
var NDVI1= image.expression('(NIR - SWIR1)/(NIR + SWIR1)' ,{
  'NIR': image.select('B8'),
  'SWIR1': image.select('B11'),
  }).rename('NDVI1')
  
// 14 NDVI2
var NDVI2= image.expression('(Green - NIR)/(Green + NIR)' ,{
  'NIR': image.select('B8'),
  'Green': image.select('B3'),
  }).rename('NDVI2')

// 15 NHI (Normalized Humidity Index)
var NHI= image.expression('(SWIR1 - Green)/(SWIR1 + Green)' ,{
  'SWIR1': image.select('B11'),
  'Green': image.select('B3'),
  }).rename('NHI')

// 16 EVI (Enhanced Vegetation Index 1)
var EVI= image.expression('2.5 *((NIR - Red)/(NIR + 6 * Red-7.5 * Blue)+1)' ,{
  'NIR': image.select('B8'),
  'Red': image.select('B4'),
  'Blue':image.select('B2'),
  }).rename('EVI')

// 17 EVI2 (Enhanced Vegetation Index 2)
var EVI2= image.expression('2.4 * ((NIR - Red)/(NIR + Red + 1))' ,{
  'NIR': image.select('B8'),
  'Red': image.select('B4'),
  }).rename('EVI2')

// 18 EVI2_2 (2-band Enhanced Vegetation Index)
var EVI2_2= image.expression('2.5 *((NIR - Red)/(NIR + 2.4 * Red+ 1))' ,{
  'NIR': image.select('B8'),
  'Red': image.select('B4'),
  }).rename('EVI2_2') 

// 29 MSAVI (Modified Soil Adjusted Vegetation Index)
var MSAVI= image.expression('(2 * NIR + 1 - sqrt(pow((2 * NIR + 1), 2) - 8 * (NIR - Red)) ) / 2' ,{
  'NIR': image.select('B8'),
  'Red': image.select('B4'),
  }).rename('MSAVI') 

// 20 Norm_G (Normalised Green)
var Norm_G= image.expression('(Green)/(NIRwide + Red + Green)',{
  'NIRwide': image.select('B8'),
  'Green': image.select('B3'),
  'Red': image.select('B4'),
  }).rename('Norm_G')

// 21 Norm-NIR (Normalised NIR)
var Norm_NIR= image.expression('(NIRwide)/(NIRwide + Red + Green)',{
  'NIRwide': image.select('B8'),
  'Green': image.select('B3'),
  'Red': image.select('B4'),
  }).rename('Norm_NIR')

// 22 Norm-R (Normalised Red)
var Norm_Red= image.expression('(Red)/(NIRwide + Red + Green)',{
  'NIRwide': image.select('B8'),
  'Green': image.select('B3'),
  'Red': image.select('B4'),
  }).rename('Norm_Red')

// 23 RededgePeakArea (Red-edge peak area)
var RededgePeakArea= image.expression('(Red+ Rededge1 + Rededge2 + Rededge3 + NIRnarrow)',{
  'NIRnarrow': image.select('B8A'),
  'Rededge1': image.select('B5'),
  'Rededge2': image.select('B6'),
  'Rededge3': image.select('B7'),
  'Red': image.select('B4'),
  }).rename('RededgePeakArea')
  
// 24 RedSWIR1 (Bands difference)
var RedSWIR1= image.expression('(Red- SWIR)',{
  'SWIR': image.select('B11'),
  'Red': image.select('B4'),
  }).rename('RedSWIR1') 
  
// 25 RTVIcore (Red-edge Triangular Vegetation Index) 
  var RTVIcore= image.expression('(100 * (NIRnarrow - Rededge1) - 10 * (NIRnarrow - Green))',{
  'NIRnarrow': image.select('B8A'),
  'Rededge1': image.select('B5'),
  'Green': image.select('B3'),
  }).rename('RTVIcore') 
  
  // 26 SAVI (Soil Adjusted Vegetation Index)
var SAVI= image.expression('((NIRnarrow - Red) / (NIRnarrow + Red + 0.5) * 1.5)',{
  'NIRnarrow': image.select('B8A'),
  'Red': image.select('B4'),
  }).rename('SAVI')  
  
// 27 SR-BlueRededge1 (Simple Blue and Red-edge 1 Ratio)  
  var SRBlueRededge1= image.expression('(Blue/Rededge1)',{
  'Blue': image.select('B2'),
  'Rededge1': image.select('B5'),
  }).rename('SRBlueRededge1') 
  
// 28 SR-BlueRededge2 (Simple Blue and Red-edge 2 Ratio)  
  var SRBlueRededge2= image.expression('(Blue/Rededge2)',{
  'Blue': image.select('B2'),
  'Rededge2': image.select('B6'),
  }).rename('SRBlueRededge2') 
  
  
  // 29 SR-BlueRededge3 (Simple Blue and Red-edge 3 Ratio)  
  var SRBlueRededge3= image.expression('(Blue/Rededge3)',{
  'Blue': image.select('B2'),
  'Rededge3': image.select('B7'),
  }).rename('SRBlueRededge3') 
  
// 30 SR-NIRnarrowBlue (Simple ratio NIR narrow and Blue) 
  var  SRNIRnarrowBlue= image.expression('(NIRnarrow/Blue)',{
  'NIRnarrow': image.select('B8A'), 
  'Blue': image.select('B2'),
  }).rename('SRNIRnarrowBlue') 
  
// 31 SR-NIRnarrowGreen (Simple ratio NIR narrow and Green)
var  SRNIRnarrowGreen= image.expression('(NIRnarrow/Green)',{
  'NIRnarrow': image.select('B8A'), 
  'Green': image.select('B3'),
  }).rename('SRNIRnarrowGreen')

// 32 SR-NIRnarrowRed (Simple ratio NIR narrow and Red)
var  SRNIRnarrowRed= image.expression('(NIRnarrow/Red)',{
  'NIRnarrow': image.select('B8A'), 
  'Red': image.select('B4'),
  }).rename('SRNIRnarrowRed')

// 33 SR-NIRnarrowRededge1 (Simple NIR and Red-edge 1 Ratio)
var  SRNIRnarrowRededge1= image.expression('(NIRnarrow/Rededge1)',{
  'NIRnarrow': image.select('B8A'), 
  'Rededge1': image.select('B5'),
  }).rename('SRNIRnarrowRededge1')

// 34 SR-NIRnarrowRededge2 (Simple NIR and Red-edge 2 Ratio)
var  SRNIRnarrowRededge2= image.expression('(NIRnarrow/Rededge2)',{
  'NIRnarrow': image.select('B8A'), 
  'Rededge2': image.select('B6'),
  }).rename('SRNIRnarrowRededge2')

// 35 SR-NIRnarrowRededge3 (Simple NIR and Red-edge 3 Ratio)
var  SRNIRnarrowRededge3= image.expression('(NIRnarrow/Rededge3)',{
  'NIRnarrow': image.select('B8A'), 
  'Rededge3': image.select('B7'),
  }).rename('SRNIRnarrowRededge3')

// 36 STI (Soil Tillage Index)
var  STI= image.expression('(SWIR1 / SWIR2)',{
  'SWIR1': image.select('B11'), 
  'SWIR2': image.select('B12'),
  }).rename('STI')

// 37 WBI (Water Body Index)
var  WBI= image.expression('(Blue - Red) / (Blue + Red)',{
  'Blue': image.select('B2'), 
  'Red': image.select('B4'),
  }).rename('WBI')

// 38 NDMI (Normalized Difference Moisture Index)
var  NDMI= image.expression('(NIR-SWIR)/(NIR+SWIR)',{
  'NIR': image.select('B8'), 
  'SWIR': image.select('B11'),
  }).rename('NDMI')

// 39 NDBR (Normalized Difference Burning Ratio) (also referred to as NBR)
var  NDBR= image.expression('(NIR-MIR)/(NIR+MIR)',{
  'NIR': image.select('B8'), 
  'MIR': image.select('B12'),
  }).rename('NDBR')
  
  //adding bands to the image
var image_final = image.addBands(NDVI);
var image_final = image_final.addBands(Chlogreen);
var image_final = image_final.addBands(LAnthoC);
var image_final = image_final.addBands(LChloC);
var image_final = image_final.addBands(LCaroC);
var image_final = image_final.addBands(BAI);
var image_final = image_final.addBands(GI);
var image_final = image_final.addBands(gNDVI);
var image_final = image_final.addBands(MSI);
var image_final = image_final.addBands(NDrededgeSWIR);
var image_final = image_final.addBands(NDTI);
var image_final = image_final.addBands(NDVIre);
var image_final = image_final.addBands(NDVI1);
var image_final = image_final.addBands(NDVI2);
var image_final = image_final.addBands(NHI);
var image_final = image_final.addBands(EVI);
var image_final = image_final.addBands(EVI2);
var image_final = image_final.addBands(EVI2_2);
var image_final = image_final.addBands(MSAVI);
var image_final = image_final.addBands(Norm_G);
var image_final = image_final.addBands(Norm_NIR);
var image_final = image_final.addBands(Norm_Red);
var image_final = image_final.addBands(RededgePeakArea);
var image_final = image_final.addBands(RedSWIR1);
var image_final = image_final.addBands(RTVIcore);
var image_final = image_final.addBands(SAVI);
var image_final = image_final.addBands(SRBlueRededge1);
var image_final = image_final.addBands(SRBlueRededge2);
var image_final = image_final.addBands(SRBlueRededge3);
var image_final = image_final.addBands(SRNIRnarrowBlue);
var image_final = image_final.addBands(SRNIRnarrowGreen);
var image_final = image_final.addBands(SRNIRnarrowRed);
var image_final = image_final.addBands(SRNIRnarrowRededge1);
var image_final = image_final.addBands(SRNIRnarrowRededge2);
var image_final = image_final.addBands(SRNIRnarrowRededge3);
var image_final = image_final.addBands(STI);
var image_final = image_final.addBands(WBI);
var image_final = image_final.addBands(NDMI);
var image_final = image_final.addBands(NDBR);

print(image_final, 'image_bands')



// Sample data for training
// var trainingData = training; // Ensure your 'training' collection contains regions with 'class' property
var trainingSamples = image_final.sampleRegions({
  collection: training,
  properties: ['ID', 'LULC'], 
  scale: 10
});

var bands= ['B2', 'B3', 'B4', 'B5', 'B6', 'B7','B8','B8A', 'B9', 'B11', 'B12','NDVI','LAnthoC', 'LChloC', 'LCaroC', 'BAI', 'GI', 'gNDVI', 'MSI', 'NDrededgeSWIR', 'NDTI',
'NDVIre', 'NDVI1', 'NDVI2', 'NHI', 'EVI', 'EVI2', 'EVI2_2','MSAVI', 'Norm_G', 'Norm_NIR', 'Norm_Red', 'RededgePeakArea', 'RedSWIR1', 'RTVIcore', 'SAVI', 'SRBlueRededge1', 'SRBlueRededge2', 'SRBlueRededge3',
'SRNIRnarrowBlue', 'SRNIRnarrowGreen', 'SRNIRnarrowRed', 'SRNIRnarrowRededge1', 'SRNIRnarrowRededge2', 'SRNIRnarrowRededge3', 'STI', 'WBI', 'NDMI', 'NDBR'];

// Export.table.toDrive({
//   collection: training ,
//   description:'uMzimClassification1_Training',
//   fileFormat: 'CSV',
// });

// Train Random Forest classifier
var classifier = ee.Classifier.smileRandomForest(100).train({
  features: trainingSamples,
  classProperty: 'ID',
  inputProperties: image_final.bandNames()
});

// Classify the composite image
var classified = image_final.classify(classifier);

var uMzimvubuPalette= [
  'cd6090', //B.wattle//dark purple
  'F91DF9', //Gum/purple
  '741b47', //Other invasive alien trees
  'fd0618',//Pine, red
  '674EA7', // Poplar,
  'eea2ad', //S.Wattle// light purple
  'ffffff', // Bare Ground// White
  'FEE238', // Dryland AG// Yellow
  'a8a800', // Grassland // citrus green
  '6aa84f', // Indigenous Bush // moderate dark green
  'ffff00', // Irrigated AG // Lime green
  '783f04', // Maize/ brown
  '000000', //Urban//black
  '0a14f9', // Water// Royal blue
  '08f3e4', // Wetland//Baby blue
  ]


// var LULC_Clipped= classified.clip(ROI);
Map.addLayer(classified, {min: 1, max: 15, palette: uMzimvubuPalette}, 'classification');

// Export the classified map to Google Drive
Export.image.toDrive({
  image: classified,
  description: 'DailyComposite',
  region: ROI.geometry(),
  scale: 10,
  crs: 'EPSG:32735',
  maxPixels: 1e13
});

// //  70% used in training
// var training_70 = classified.select('classification').sampleRegions({
//   collection: training, 
//   properties: ['ID'], 
//   tileScale: 6, //this helps with processing
//   geometries: true,
//   scale: 10
// });

// Export.table.toDrive({
//   collection: trainingSamples ,
//   description:'uMzimClassification_CompositeImage',
//   fileFormat: 'CSV',
// });