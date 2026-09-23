import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { DISTRICTS_BY_STATE } from '../data/indiaData';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin',
  'Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia',
  'Comoros','Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany',
  'Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary',
  'Iceland','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta',
  'Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro',
  'Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger',
  'Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore',
  'Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain',
  'Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand',
  'Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda',
  'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Afghanistan': ['Kabul','Kandahar','Herat','Mazar-i-Sharif','Jalalabad','Kunduz'],
  'Albania': ['Tirana','Durrës','Vlorë','Shkodër','Fier','Korçë'],
  'Algeria': ['Algiers','Oran','Constantine','Annaba','Blida','Batna','Sétif'],
  'Andorra': ['Andorra la Vella','Escaldes-Engordany','Encamp','Sant Julià de Lòria'],
  'Angola': ['Luanda','Huambo','Lobito','Benguela','Kuito','Malanje'],
  'Antigua and Barbuda': ["Saint John's",'Codrington','All Saints','Liberta'],
  'Argentina': ['Buenos Aires','Córdoba','Rosario','Mendoza','Tucumán','La Plata','Mar del Plata','Salta'],
  'Armenia': ['Yerevan','Gyumri','Vanadzor','Vagharshapat','Abovyan'],
  'Australia': ['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Canberra','Newcastle','Sunshine Coast','Wollongong','Hobart','Geelong','Townsville','Cairns','Darwin'],
  'Austria': ['Vienna','Graz','Linz','Salzburg','Innsbruck','Klagenfurt','Villach','Wels'],
  'Azerbaijan': ['Baku','Ganja','Sumqayit','Mingachevir','Nakhchivan'],
  'Bahamas': ['Nassau','Freeport','West End','Coopers Town','Marsh Harbour'],
  'Bahrain': ['Manama','Muharraq','Riffa','Hamad Town','Isa Town','Sitra','Jidhafs'],
  'Bangladesh': ['Dhaka','Chittagong','Sylhet','Khulna','Rajshahi','Comilla','Narayanganj','Gazipur'],
  'Barbados': ['Bridgetown','Speightstown','Oistins','Bathsheba'],
  'Belarus': ['Minsk','Gomel','Mogilev','Vitebsk','Grodno','Brest','Babruysk'],
  'Belgium': ['Brussels','Antwerp','Ghent','Charleroi','Liège','Bruges','Namur','Leuven'],
  'Belize': ['Belmopan','Belize City','San Ignacio','Orange Walk','Dangriga'],
  'Benin': ['Cotonou','Porto-Novo','Parakou','Abomey-Calavi','Djougou'],
  'Bhutan': ['Thimphu','Phuentsholing','Punakha','Wangdue Phodrang','Gelephu'],
  'Bolivia': ['La Paz','Cochabamba','Santa Cruz de la Sierra','Oruro','Potosí','Sucre'],
  'Bosnia and Herzegovina': ['Sarajevo','Banja Luka','Tuzla','Zenica','Mostar','Brčko'],
  'Botswana': ['Gaborone','Francistown','Molepolole','Maun','Serowe','Kanye'],
  'Brazil': ['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza','Belo Horizonte','Manaus','Curitiba','Recife','Porto Alegre'],
  'Brunei': ['Bandar Seri Begawan','Kuala Belait','Seria','Tutong','Bangar'],
  'Bulgaria': ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven'],
  'Burkina Faso': ['Ouagadougou','Bobo-Dioulasso','Koudougou','Ouahigouya','Banfora'],
  'Burundi': ['Bujumbura','Gitega','Muyinga','Rumonge','Ngozi'],
  'Cabo Verde': ['Praia','Mindelo','Santa Maria','Assomada','Pedra Badejo'],
  'Cambodia': ['Phnom Penh','Siem Reap','Battambang','Sihanoukville','Kampong Cham'],
  'Cameroon': ['Yaoundé','Douala','Bamenda','Bafoussam','Garoua','Maroua'],
  'Canada': ['Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Winnipeg','Quebec City','Hamilton','Kitchener','London','Victoria','Halifax','Oshawa','Windsor','Mississauga','Brampton','Surrey'],
  'Central African Republic': ['Bangui','Bimbo','Berbérati','Carnot','Bambari'],
  'Chad': ["N'Djamena",'Moundou','Sarh','Abéché','Kelo'],
  'Chile': ['Santiago','Valparaíso','Concepción','La Serena','Antofagasta','Temuco','Rancagua'],
  'China': ['Beijing','Shanghai','Guangzhou','Shenzhen','Chengdu','Hangzhou','Wuhan',"Xi'an",'Nanjing','Tianjin','Chongqing','Suzhou','Wuxi','Dongguan','Foshan'],
  'Colombia': ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Cúcuta','Bucaramanga','Pereira'],
  'Comoros': ['Moroni','Mutsamudu','Fomboni','Domoni'],
  'Congo (Brazzaville)': ['Brazzaville','Pointe-Noire','Dolisie','Nkayi','Ouesso'],
  'Congo (Kinshasa)': ['Kinshasa','Lubumbashi','Mbuji-Mayi','Goma','Bukavu','Kisangani'],
  'Costa Rica': ['San José','Alajuela','Cartago','Heredia','Liberia','Limón'],
  'Croatia': ['Zagreb','Split','Rijeka','Osijek','Zadar','Slavonski Brod'],
  'Cuba': ['Havana','Santiago de Cuba','Camagüey','Holguín','Santa Clara','Guantánamo'],
  'Cyprus': ['Nicosia','Limassol','Larnaca','Paphos','Famagusta'],
  'Czech Republic': ['Prague','Brno','Ostrava','Plzeň','Liberec','Olomouc','Ústí nad Labem'],
  'Denmark': ['Copenhagen','Aarhus','Odense','Aalborg','Esbjerg','Randers','Kolding'],
  'Djibouti': ['Djibouti City','Ali Sabieh','Dikhil','Tadjoura','Obock'],
  'Dominica': ['Roseau','Portsmouth','Marigot','Mahaut','Saint Joseph'],
  'Dominican Republic': ['Santo Domingo','Santiago de los Caballeros','La Romana','San Pedro de Macorís','Puerto Plata'],
  'Ecuador': ['Quito','Guayaquil','Cuenca','Ambato','Manta','Portoviejo','Machala'],
  'Egypt': ['Cairo','Alexandria','Giza','Shubra El Kheima','Port Said','Suez','Luxor','Aswan'],
  'El Salvador': ['San Salvador','Santa Ana','San Miguel','Mejicanos','Apopa','Delgado'],
  'Equatorial Guinea': ['Malabo','Bata','Ebebiyín','Aconibe','Añisoc'],
  'Eritrea': ['Asmara','Keren','Massawa','Assab','Mendefera'],
  'Estonia': ['Tallinn','Tartu','Narva','Pärnu','Kohtla-Järve'],
  'Eswatini': ['Mbabane','Manzini','Lobamba','Big Bend','Malkerns'],
  'Ethiopia': ['Addis Ababa','Dire Dawa','Mekelle','Gondar','Hawassa','Bahir Dar','Adama'],
  'Fiji': ['Suva','Nadi','Lautoka','Labasa','Ba','Levuka'],
  'Finland': ['Helsinki','Espoo','Tampere','Vantaa','Oulu','Turku','Jyväskylä'],
  'France': ['Paris','Lyon','Marseille','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux','Lille','Rennes','Reims','Le Havre'],
  'Gabon': ['Libreville','Port-Gentil','Franceville','Oyem','Moanda'],
  'Gambia': ['Banjul','Serekunda','Brikama','Bakau','Farafenni'],
  'Georgia': ['Tbilisi','Kutaisi','Batumi','Rustavi','Zugdidi','Gori'],
  'Germany': ['Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart','Düsseldorf','Leipzig','Dortmund','Essen','Bremen','Dresden','Hanover','Nuremberg','Duisburg'],
  'Ghana': ['Accra','Kumasi','Tamale','Sekondi-Takoradi','Cape Coast','Obuasi','Tema'],
  'Greece': ['Athens','Thessaloniki','Patras','Piraeus','Larissa','Heraklion','Volos'],
  'Grenada': ["Saint George's",'Gouyave','Victoria','Grenville','Sauteurs'],
  'Guatemala': ['Guatemala City','Mixco','Villa Nueva','Quetzaltenango','San Marcos','Chimaltenango'],
  'Guinea': ['Conakry','Nzérékoré','Kindia','Kankan','Labé'],
  'Guinea-Bissau': ['Bissau','Bafatá','Gabú','Bissorã','Bolama'],
  'Guyana': ['Georgetown','Linden','New Amsterdam','Bartica','Skeldon'],
  'Haiti': ['Port-au-Prince','Carrefour','Delmas','Pétionville','Cap-Haïtien','Gonaïves'],
  'Honduras': ['Tegucigalpa','San Pedro Sula','Choloma','La Ceiba','El Progreso','Comayagua'],
  'Hungary': ['Budapest','Debrecen','Miskolc','Szeged','Pécs','Győr','Nyíregyháza'],
  'Iceland': ['Reykjavik','Kópavogur','Hafnarfjörður','Akureyri','Reykjanesbær'],
  'Indonesia': ['Jakarta','Surabaya','Bandung','Bekasi','Medan','Depok','Tangerang','Semarang','Makassar','Palembang'],
  'Iran': ['Tehran','Mashhad','Isfahan','Karaj','Tabriz','Shiraz','Ahvaz','Qom'],
  'Iraq': ['Baghdad','Basra','Mosul','Erbil','Najaf','Karbala','Kirkuk','Sulaymaniyah'],
  'Ireland': ['Dublin','Cork','Limerick','Galway','Waterford','Drogheda','Dundalk','Swords'],
  'Israel': ['Jerusalem','Tel Aviv','Haifa','Rishon LeZion','Petah Tikva','Ashdod','Netanya','Beer Sheva'],
  'Italy': ['Rome','Milan','Naples','Turin','Palermo','Genoa','Bologna','Florence','Venice','Bari','Catania','Verona'],
  'Jamaica': ['Kingston','Spanish Town','Portmore','Montego Bay','May Pen','Mandeville'],
  'Japan': ['Tokyo','Osaka','Yokohama','Nagoya','Sapporo','Fukuoka','Kobe','Kyoto','Kawasaki','Saitama','Hiroshima','Sendai'],
  'Jordan': ['Amman','Zarqa','Irbid','Russeifa','Wadi as-Seer','Aqaba'],
  'Kazakhstan': ['Almaty','Astana','Shymkent','Karaganda','Aktobe','Taraz','Pavlodar'],
  'Kenya': ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi'],
  'Kiribati': ['South Tarawa','Betio','Bikenibeu','Eita'],
  'Kuwait': ['Kuwait City','Hawalli','Salmiya','Farwaniya','Ahmadi','Jahra','Mangaf'],
  'Kyrgyzstan': ['Bishkek','Osh','Jalal-Abad','Karakol','Tokmok'],
  'Laos': ['Vientiane','Pakse','Savannakhet','Luang Prabang','Thakhek'],
  'Latvia': ['Riga','Daugavpils','Liepāja','Jelgava','Jūrmala','Ventspils'],
  'Lebanon': ['Beirut','Tripoli','Sidon','Tyre','Jounieh','Zahlé'],
  'Lesotho': ['Maseru','Teyateyaneng','Mafeteng','Hlotse','Mohale\'s Hoek'],
  'Liberia': ['Monrovia','Gbarnga','Kakata','Bensonville','Harper'],
  'Libya': ['Tripoli','Benghazi','Misrata','Tarhuna','Al Khums','Al Bayda'],
  'Liechtenstein': ['Vaduz','Schaan','Balzers','Triesen','Triesenberg'],
  'Lithuania': ['Vilnius','Kaunas','Klaipėda','Šiauliai','Panevėžys'],
  'Luxembourg': ['Luxembourg City','Esch-sur-Alzette','Differdange','Dudelange','Ettelbruck'],
  'Madagascar': ['Antananarivo','Toamasina','Antsirabe','Fianarantsoa','Mahajanga','Toliara'],
  'Malawi': ['Lilongwe','Blantyre','Mzuzu','Zomba','Kasungu'],
  'Malaysia': ['Kuala Lumpur','George Town','Ipoh','Johor Bahru','Shah Alam','Petaling Jaya','Kota Kinabalu','Kuching','Subang Jaya','Klang'],
  'Maldives': ['Malé','Addu City','Fuvahmulah','Kulhudhuffushi','Thinadhoo'],
  'Mali': ['Bamako','Sikasso','Mopti','Ségou','Kayes','Koutiala'],
  'Malta': ['Valletta','Birkirkara','Mosta','San Pawl il-Baħar','Qormi','Żabbar'],
  'Marshall Islands': ['Majuro','Ebeye','Arno','Jaluit'],
  'Mauritania': ['Nouakchott','Nouadhibou','Néma','Kaédi','Zouerate'],
  'Mauritius': ['Port Louis','Beau Bassin-Rose Hill','Vacoas-Phoenix','Curepipe','Quatre Bornes'],
  'Mexico': ['Mexico City','Guadalajara','Monterrey','Puebla','Tijuana','León','Juárez','Mérida','San Luis Potosí','Zapopan'],
  'Micronesia': ['Palikir','Weno','Kolonia','Tofol','Colonia'],
  'Moldova': ['Chișinău','Tiraspol','Bălți','Bender','Rîbnița'],
  'Monaco': ['Monaco','Monte Carlo','La Condamine','Fontvieille'],
  'Mongolia': ['Ulaanbaatar','Erdenet','Darkhan','Choibalsan','Ölgii'],
  'Montenegro': ['Podgorica','Nikšić','Herceg Novi','Pljevlja','Bar'],
  'Morocco': ['Casablanca','Rabat','Fez','Marrakesh','Agadir','Tangier','Meknes','Oujda'],
  'Mozambique': ['Maputo','Matola','Nampula','Beira','Chimoio','Quelimane'],
  'Myanmar': ['Naypyidaw','Yangon','Mandalay','Mawlamyine','Bago','Pathein'],
  'Namibia': ['Windhoek','Swakopmund','Walvis Bay','Oshakati','Grootfontein'],
  'Nauru': ['Yaren','Denigomodu','Aiwo','Anabar'],
  'Nepal': ['Kathmandu','Pokhara','Lalitpur','Biratnagar','Birgunj','Bharatpur','Dharan'],
  'Netherlands': ['Amsterdam','Rotterdam','The Hague','Utrecht','Eindhoven','Groningen','Tilburg','Almere','Breda'],
  'New Zealand': ['Auckland','Wellington','Christchurch','Hamilton','Tauranga','Napier','Dunedin','Palmerston North','Nelson'],
  'Nicaragua': ['Managua','León','Masaya','Matagalpa','Chinandega','Granada'],
  'Niger': ['Niamey','Zinder','Maradi','Agadez','Tahoua','Dosso'],
  'Nigeria': ['Lagos','Abuja','Kano','Ibadan','Port Harcourt','Benin City','Kaduna','Enugu','Onitsha','Aba'],
  'North Korea': ['Pyongyang','Hamhung','Chongjin','Nampo','Wonsan','Sinuiju'],
  'North Macedonia': ['Skopje','Bitola','Kumanovo','Tetovo','Veles'],
  'Norway': ['Oslo','Bergen','Trondheim','Stavanger','Drammen','Fredrikstad','Kristiansand'],
  'Oman': ['Muscat','Salalah','Sohar','Nizwa','Sur','Ibri','Khasab','Rustaq'],
  'Pakistan': ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Gujranwala','Sialkot'],
  'Palau': ['Ngerulmud','Koror','Meyungs','Airai'],
  'Palestine': ['Gaza','Hebron','Ramallah','Nablus','Jenin','Bethlehem','Jericho'],
  'Panama': ['Panama City','Colón','David','La Chorrera','Santiago'],
  'Papua New Guinea': ['Port Moresby','Lae','Mount Hagen','Madang','Kokopo'],
  'Paraguay': ['Asunción','Ciudad del Este','San Lorenzo','Luque','Capiatá'],
  'Peru': ['Lima','Arequipa','Trujillo','Chiclayo','Piura','Iquitos','Cusco'],
  'Philippines': ['Manila','Quezon City','Davao','Cebu City','Zamboanga','Antipolo','Taguig','Pasig','Makati'],
  'Poland': ['Warsaw','Kraków','Łódź','Wrocław','Poznań','Gdańsk','Szczecin','Bydgoszcz','Lublin'],
  'Portugal': ['Lisbon','Porto','Vila Nova de Gaia','Amadora','Braga','Setúbal','Coimbra','Funchal'],
  'Qatar': ['Doha','Al Rayyan','Al Wakrah','Al Khor','Umm Salal','Dukhan','Al Shahaniya'],
  'Romania': ['Bucharest','Cluj-Napoca','Timișoara','Iași','Constanța','Craiova','Brașov','Galați'],
  'Russia': ['Moscow','Saint Petersburg','Novosibirsk','Yekaterinburg','Kazan','Nizhny Novgorod','Chelyabinsk','Samara','Omsk','Rostov-on-Don'],
  'Rwanda': ['Kigali','Butare','Gitarama','Musanze','Byumba','Cyangugu'],
  'Saint Kitts and Nevis': ['Basseterre','Charlestown','Sandy Point Town','Dieppe Bay Town'],
  'Saint Lucia': ['Castries','Gros Islet','Vieux Fort','Micoud','Dennery'],
  'Saint Vincent and the Grenadines': ['Kingstown','Georgetown','Barrouallie','Chateaubelair'],
  'Samoa': ['Apia','Vaitele','Faleolo','Salelologa'],
  'San Marino': ['San Marino City','Serravalle','Borgo Maggiore','Domagnano'],
  'Sao Tome and Principe': ['São Tomé','Santo António'],
  'Saudi Arabia': ['Riyadh','Jeddah','Mecca','Medina','Dammam','Khobar','Taif','Tabuk','Buraydah','Khamis Mushait','Hail','Jubail'],
  'Senegal': ['Dakar','Touba','Thiès','Rufisque','Kaolack','Saint-Louis'],
  'Serbia': ['Belgrade','Novi Sad','Niš','Kragujevac','Subotica','Zrenjanin'],
  'Seychelles': ['Victoria','Anse Boileau','Beau Vallon','Cascade'],
  'Sierra Leone': ['Freetown','Bo','Kenema','Makeni','Koidu'],
  'Singapore': ['Singapore','Jurong East','Woodlands','Tampines','Ang Mo Kio','Bedok','Yishun','Choa Chu Kang'],
  'Slovakia': ['Bratislava','Košice','Prešov','Žilina','Nitra','Banská Bystrica'],
  'Slovenia': ['Ljubljana','Maribor','Celje','Kranj','Velenje','Koper'],
  'Solomon Islands': ['Honiara','Auki','Gizo','Kirakira','Buala'],
  'Somalia': ['Mogadishu','Hargeisa','Bosasso','Kismayo','Marka','Berbera'],
  'South Africa': ['Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth','Bloemfontein','East London','Polokwane','Pietermaritzburg'],
  'South Korea': ['Seoul','Busan','Incheon','Daegu','Daejeon','Gwangju','Suwon','Ulsan','Seongnam'],
  'South Sudan': ['Juba','Wau','Malakal','Yei','Bor','Torit'],
  'Spain': ['Madrid','Barcelona','Valencia','Seville','Zaragoza','Málaga','Murcia','Bilbao','Valladolid','Palma','Las Palmas'],
  'Sri Lanka': ['Colombo','Kandy','Galle','Jaffna','Negombo','Trincomalee','Batticaloa','Anuradhapura'],
  'Sudan': ['Khartoum','Omdurman','Khartoum North','Port Sudan','Kassala','El Obeid'],
  'Suriname': ['Paramaribo','Lelydorp','Nieuw Nickerie','Moengo','Nieuw Amsterdam'],
  'Sweden': ['Stockholm','Gothenburg','Malmö','Uppsala','Västerås','Örebro','Linköping','Helsingborg','Jönköping'],
  'Switzerland': ['Zurich','Geneva','Basel','Lausanne','Bern','Winterthur','Lucerne','St. Gallen'],
  'Syria': ['Damascus','Aleppo','Homs','Latakia','Hama','Deir ez-Zor'],
  'Taiwan': ['Taipei','Kaohsiung','Taichung','Tainan','Hsinchu','Keelung','Taoyuan'],
  'Tajikistan': ['Dushanbe','Khujand','Kulob','Qurghonteppa','Istaravshan'],
  'Tanzania': ['Dar es Salaam','Dodoma','Mwanza','Zanzibar City','Arusha','Mbeya'],
  'Thailand': ['Bangkok','Nonthaburi','Pak Kret','Hat Yai','Chiang Mai','Pattaya','Udon Thani','Surat Thani'],
  'Timor-Leste': ['Dili','Baucau','Maliana','Suai','Lospalos'],
  'Togo': ['Lomé','Sokodé','Kara','Kpalimé','Atakpamé'],
  'Tonga': ["Nuku'alofa",'Neiafu','Haveluloto','Pangai'],
  'Trinidad and Tobago': ['Port of Spain','San Fernando','Chaguanas','Arima','Point Fortin'],
  'Tunisia': ['Tunis','Sfax','Sousse','Kairouan','Bizerte','Gabès','Ariana'],
  'Turkey': ['Istanbul','Ankara','Izmir','Bursa','Adana','Gaziantep','Konya','Antalya','Kayseri','Mersin'],
  'Turkmenistan': ['Ashgabat','Türkmenabat','Mary','Balkanabat','Daşoguz'],
  'Tuvalu': ['Funafuti','Savave','Tanrake','Toga'],
  'Uganda': ['Kampala','Gulu','Lira','Mbarara','Jinja','Bwizibwera'],
  'Ukraine': ['Kyiv','Kharkiv','Odesa','Dnipro','Donetsk','Zaporizhzhia','Lviv','Kryvyi Rih','Mykolaiv'],
  'United Arab Emirates': ['Dubai','Abu Dhabi','Sharjah','Ajman','Al Ain','Ras Al Khaimah','Fujairah','Umm Al Quwain','Kalba','Khor Fakkan'],
  'United Kingdom': ['London','Birmingham','Manchester','Leeds','Glasgow','Southampton','Liverpool','Sheffield','Bristol','Edinburgh','Leicester','Coventry','Bradford','Nottingham','Kingston upon Hull','Derby','Stoke-on-Trent','Newcastle upon Tyne','Cardiff','Belfast'],
  'United States': ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis','San Francisco','Seattle','Denver','Nashville','El Paso','Washington DC','Boston','Las Vegas','Portland','Memphis','Louisville','Baltimore','Milwaukee','Albuquerque'],
  'Uruguay': ['Montevideo','Salto','Paysandú','Las Piedras','Rivera','Tacuarembó'],
  'Uzbekistan': ['Tashkent','Namangan','Samarkand','Andijan','Nukus','Fergana'],
  'Vanuatu': ['Port Vila','Luganville','Isangel','Sola'],
  'Vatican City': ['Vatican City'],
  'Venezuela': ['Caracas','Maracaibo','Valencia','Barquisimeto','Ciudad Guayana','Barcelona','Maturín'],
  'Vietnam': ['Hanoi','Ho Chi Minh City','Da Nang','Haiphong','Can Tho','Bien Hoa','Hue','Nha Trang'],
  'Yemen': ["Sana'a",'Aden','Taiz','Al Hudaydah','Ibb','Dhamar','Al Mukalla'],
  'Zambia': ['Lusaka','Kitwe','Ndola','Kabwe','Chingola','Mufulira','Livingstone'],
  'Zimbabwe': ['Harare','Bulawayo','Chitungwiza','Mutare','Gweru','Kwekwe','Kadoma'],
};

const PINCODE_FORMAT: Record<string, string> = {
  'United States': '5-digit ZIP (e.g. 10001)',
  'United Kingdom': 'Postcode (e.g. SW1A 1AA)',
  'Canada': 'Postal code (e.g. M5V 3A8)',
  'Australia': '4-digit postcode',
  'Germany': '5-digit PLZ',
  'France': '5-digit code',
  'Japan': '7-digit (e.g. 100-0001)',
  'Singapore': '6-digit postal code',
  'United Arab Emirates': 'P.O. Box / 5-digit',
  'Saudi Arabia': '5-digit',
  'Qatar': '5-digit',
  'Kuwait': '5-digit',
  'Bahrain': '4-digit',
  'Oman': '3-digit',
  'New Zealand': '4-digit',
  'South Africa': '4-digit',
  'Netherlands': '4 digits + 2 letters',
  'India': '6-digit pincode',
};

const INDIAN_STATES = Object.keys(DISTRICTS_BY_STATE);

function calculateAge(dob: string): string {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age.toString() : '';
}

export function CreateUserPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', dob: '', age: '',
    aadhaar: '', voterId: '', passport: '',
    country: '', currentPlace: '', currentAddress: '', currentPincode: '',
    indianAddress: '', indianState: '', indianDistrict: '', indianPlace: '',
    assemblyConstituency: '', parliamentConstituency: '', indianPincode: '',
  });

  const [dupErrors, setDupErrors] = useState({ aadhaar: '', voterId: '', passport: '' });
  const [submitError, setSubmitError] = useState('');

  const age = form.age ? parseInt(form.age) : null;
  const ageIneligible = age !== null && age < 18;

  const DUP_LABELS: Record<string, string> = {
    aadhaar: 'Aadhaar number',
    voterId: 'Voter ID',
    passport: 'Passport number',
  };

  function runDupCheck(field: 'aadhaar' | 'voterId' | 'passport', value: string) {
    const users: Record<string, string>[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const exists = value.trim().length > 0 && users.some(u => (u[field] || '').trim() === value.trim());
    setDupErrors(prev => ({
      ...prev,
      [field]: exists ? `This ${DUP_LABELS[field]} is already registered.` : '',
    }));
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'dob') updated.age = calculateAge(value);
      if (field === 'country') { updated.currentPlace = ''; updated.currentPincode = ''; }
      if (field === 'indianState') { updated.indianDistrict = ''; }
      return updated;
    });
    if (field === 'aadhaar' || field === 'voterId' || field === 'passport') {
      runDupCheck(field, value);
    }
  };

  const citiesForCountry = CITIES_BY_COUNTRY[form.country] || [];
  const pincodePlaceholder = form.country ? (PINCODE_FORMAT[form.country] || 'Postal / ZIP code') : 'Postal / ZIP code';
  const districtsForState = form.indianState ? (DISTRICTS_BY_STATE[form.indianState] || []) : [];

  const hasDupError = dupErrors.aadhaar !== '' || dupErrors.voterId !== '' || dupErrors.passport !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (ageIneligible) {
      setSubmitError('Voter must be 18 years or above to register.');
      return;
    }
    if (!form.age) {
      setSubmitError('Please enter a valid date of birth.');
      return;
    }

    // Final duplicate check at submit time (catches paste or autofill that skipped onChange)
    const users: Record<string, string>[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const newErrors = { aadhaar: '', voterId: '', passport: '' };
    if (users.some(u => (u.aadhaar || '').trim() === form.aadhaar.trim())) newErrors.aadhaar = 'This Aadhaar number is already registered.';
    if (users.some(u => (u.voterId || '').trim() === form.voterId.trim())) newErrors.voterId = 'This Voter ID is already registered.';
    if (users.some(u => (u.passport || '').trim() === form.passport.trim())) newErrors.passport = 'This Passport number is already registered.';

    if (newErrors.aadhaar || newErrors.voterId || newErrors.passport) {
      setDupErrors(newErrors);
      setSubmitError('Please fix the duplicate field errors before submitting.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: form.name, dob: form.dob, age: form.age,
      aadhaar: form.aadhaar, voterId: form.voterId, passport: form.passport,
      country: form.country, currentPlace: form.currentPlace,
      currentAddress: form.currentAddress, currentPincode: form.currentPincode,
      indianAddress: form.indianAddress, indianState: form.indianState,
      indianDistrict: form.indianDistrict, indianPlace: form.indianPlace,
      assemblyConstituency: form.assemblyConstituency,
      parliamentConstituency: form.parliamentConstituency,
      indianPincode: form.indianPincode,
      constituency: form.parliamentConstituency,
    };
    localStorage.setItem('registeredUsers', JSON.stringify([...users, newUser]));
    alert('User registered successfully!');
    navigate('/admin/registered-users');
  };

  const inputCls = 'w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-orange-500">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">Create User Registration</h2>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Personal Information */}
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-4 pb-2 border-b-2 border-orange-500">Personal Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={form.name} onChange={set('name')} className={inputCls} placeholder="Full name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <input type="date" value={form.dob} onChange={set('dob')} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                  <input
                    type="number" value={form.age} readOnly
                    className={`${inputCls} bg-gray-50 cursor-not-allowed ${ageIneligible ? 'border-red-400 text-red-600' : 'text-gray-600'}`}
                    placeholder="Auto-calculated"
                  />
                  {ageIneligible && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Not eligible to vote — must be 18 years or above.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Information */}
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-4 pb-2 border-b-2 border-orange-500">Identity Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhaar Number</label>
                  <input
                    type="text" value={form.aadhaar} onChange={set('aadhaar')}
                    className={`${inputCls} ${dupErrors.aadhaar ? 'border-red-400' : ''}`}
                    placeholder="XXXX XXXX XXXX" maxLength={12} required
                  />
                  {dupErrors.aadhaar && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{dupErrors.aadhaar}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Voter ID</label>
                  <input
                    type="text" value={form.voterId} onChange={set('voterId')}
                    className={`${inputCls} ${dupErrors.voterId ? 'border-red-400' : ''}`}
                    placeholder="Voter ID" required
                  />
                  {dupErrors.voterId && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{dupErrors.voterId}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Passport Number</label>
                  <input
                    type="text" value={form.passport} onChange={set('passport')}
                    className={`${inputCls} ${dupErrors.passport ? 'border-red-400' : ''}`}
                    placeholder="Passport No." required
                  />
                  {dupErrors.passport && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{dupErrors.passport}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Residence */}
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-4 pb-2 border-b-2 border-orange-500">Current Residence (Abroad)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Country</label>
                  <select value={form.country} onChange={set('country')} className={inputCls} required>
                    <option value="">-- Select Country --</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Place / City</label>
                  <select value={form.currentPlace} onChange={set('currentPlace')} className={inputCls} required disabled={!form.country}>
                    <option value="">{form.country ? '-- Select City --' : 'Select a country first'}</option>
                    {citiesForCountry.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Address</label>
                  <textarea value={form.currentAddress} onChange={set('currentAddress')} className={inputCls} rows={2} placeholder="Full address" required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Pincode / ZIP</label>
                  <input type="text" value={form.currentPincode} onChange={set('currentPincode')} className={inputCls} placeholder={pincodePlaceholder} required />
                </div>
              </div>
            </div>

            {/* Indian Permanent Address */}
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-4 pb-2 border-b-2 border-orange-500">Indian Permanent Address</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea value={form.indianAddress} onChange={set('indianAddress')} className={inputCls} rows={2} placeholder="Door No., Street, Area" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select value={form.indianState} onChange={set('indianState')} className={inputCls} required>
                    <option value="">-- Select State / UT --</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                  <select value={form.indianDistrict} onChange={set('indianDistrict')} className={inputCls} required disabled={!form.indianState}>
                    <option value="">{form.indianState ? '-- Select District --' : 'Select a state first'}</option>
                    {districtsForState.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Place / City / Town</label>
                  <input type="text" value={form.indianPlace} onChange={set('indianPlace')} className={inputCls} placeholder="City / Town / Village" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assembly Constituency</label>
                  <input type="text" value={form.assemblyConstituency} onChange={set('assemblyConstituency')} className={inputCls} placeholder="Assembly constituency" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parliament Constituency</label>
                  <input type="text" value={form.parliamentConstituency} onChange={set('parliamentConstituency')} className={inputCls} placeholder="Parliament constituency" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                  <input type="text" value={form.indianPincode} onChange={set('indianPincode')} className={inputCls} placeholder="6-digit pincode" maxLength={6} required />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-400 rounded-lg text-red-700 font-semibold text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={ageIneligible || hasDupError}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Register User
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
