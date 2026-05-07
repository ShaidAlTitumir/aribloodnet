import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

export const THANAS_BY_DISTRICT: Record<string, string[]> = {
  "Dhaka": ["Adabor", "Badda", "Bangsal", "Cantonment", "Chak Bazar", "Dakshinkhan", "Darus Salam", "Dhanmondi", "Demra", "Gendaria", "Gulshan", "Hazaribagh", "Jatrabari", "Kadamtali", "Kafrul", "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "New Market", "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Shah Ali", "Shahbagh", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", "Tejgaon Industrial Area", "Turag", "Uttara", "Uttar Khan", "Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"],
  "Satkhira": ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"],
  "Khulna": ["Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada", "Daulatpur", "Khalishpur", "Khan Jahan Ali", "Kotwali", "Sonadanga"],
  "Chattogram": ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda", "Bakalia", "Bayazid Bostami", "Chandgaon", "Double Mooring", "Halishahar", "Kotwali", "Pahartali", "Panchlaish", "Patenga"],
  "Sylhet": ["Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "South Surma", "Sylhet Sadar", "Zakiganj"],
  "Rajshahi": ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore", "Boalia", "Matihar", "Rajpari", "Shah Mokhdum"],
  "Barishal": ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Barishal Sadar", "Wazirpur"],
  "Rangpur": ["Badarganj", "Gangachara", "Kaunia", "Rangpur Sadar", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
  "Mymensingh": ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Mymensingh Sadar", "Muktagachha", "Nandail", "Phulpur", "Trishal"],
  "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
  "Narayanganj": ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"],
  "Comilla": ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Monohargonj", "Meghna", "Muradnagar", "Nangalkot", "Comilla Sadar", "Comilla Sadar South", "Titas"],
  "Bogra": ["Adamdighi", "Bogra Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Sherpur", "Shibganj", "Sonatola", "Shajahanpur"],
  "Jashore": ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Jashore Sadar", "Manirampur", "Sharsha"],
  "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhia", "Pekua"],
  "Bagerhat": ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
  "Brahmanbaria": ["Akhaura", "Bancharampur", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail", "Ashuganj", "Bijoynagar"],
  "Dinajpur": ["Birampur", "Birganj", "Birol", "Bochaganj", "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Dinajpur Sadar", "Nawabganj", "Parbatipur"],
  "Feni": ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Parshuram", "Sonagazi", "Fulgazi"],
  "Jamalpur": ["Baksiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"],
  "Kushtia": ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"],
  "Natore": ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Natore Sadar", "Singra", "Naldanga"],
  "Pabna": ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"],
  "Tangail": ["Gopalpur", "Basail", "Bhuapur", "Delduar", "Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar", "Dhanbari"],
  "Noakhali": ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Noakhali Sadar", "Kabirhat"],
  "Lakshmipur": ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"],
  "Chandpur": ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab North", "Matlab South", "Shahrasti"],
  "Pirojpur": ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Pirojpur Sadar", "Nesarabad", "Zianagar"],
  "Patuakhali": ["Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali", "Dumki"],
  "Bhola": ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
  "Naogaon": ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
  "Joypurhat": ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"],
  "Chapainawabganj": ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"],
  "Sirajganj": ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"],
  "Kurigram": ["Kurigram Sadar", "Bhurungamari", "Chilmari", "Phulbari", "Nageshwari", "Rajarhat", "Raumari", "Ulipur", "Char Rajibpur"],
  "Gaibandha": ["Gaibandha Sadar", "Phulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
  "Lalmonirhat": ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"],
  "Nilphamari": ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"],
  "Panchagarh": ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"],
  "Thakurgaon": ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"],
  "Sherpur": ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
  "Netrokona": ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Purbadhala"],
  "Kishoreganj": ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  "Munshiganj": ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"],
  "Manikganj": ["Manikganj Sadar", "Singair", "Shibalaya", "Saturia", "Harirampur", "Ghior", "Daulatpur"],
  "Narsingdi": ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
  "Madaripur": ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar"],
  "Shariatpur": ["Shariatpur Sadar", "Damudya", "Gosairhat", "Naria", "Zajira", "Bhedarganj"],
  "Gopalganj": ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
  "Rajbari": ["Rajbari Sadar", "Baliakandi", "Goalandaghat", "Pangsha", "Kalukhali"],
  "Faridpur": ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
  "Magura": ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
  "Narail": ["Narail Sadar", "Lohagara", "Kalia"],
  "Chuadanga": ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
  "Meherpur": ["Meherpur Sadar", "Gangni", "Mujibnagar"],
  "Jhenaidah": ["Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
  "Habiganj": ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj"],
  "Moulvibazar": ["Moulvibazar Sadar", "Barlekha", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal", "Juri"],
  "Sunamganj": ["Sunamganj Sadar", "Bishwamvampur", "Chhatak", "Derai", "Dharamapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Tahirpur", "South Sunamganj"],
  "Khagrachari": ["Khagrachari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
  "Rangamati": ["Rangamati Sadar", "Bagaichhari", "Barkal", "Kawkhali", "Belaichhari", "Kaptai", "Jurachhari", "Langadu", "Naniarchar", "Rajasthali"],
  "Bandarban": ["Bandarban Sadar", "Alikadam", "Duma", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
  "Barguna": ["Barguna Sadar", "Amtali", "Betagi", "Bamna", "Patharghata", "Taltali"],
  "Jhalokati": ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
};

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export interface DonorBadge {
  level: number;
  name: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  minDonations: number;
}

export function getDonorBadge(totalDonations: number): DonorBadge | null {
  if (totalDonations >= 20) {
    return {
      level: 4,
      name: 'Legendary Donor',
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      icon: 'Crown',
      minDonations: 20
    };
  }
  if (totalDonations >= 10) {
    return {
      level: 3,
      name: 'Blood Hero',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'Trophy',
      minDonations: 10
    };
  }
  if (totalDonations >= 5) {
    return {
      level: 2,
      name: 'Life Saver',
      color: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-100',
      icon: 'Shield',
      minDonations: 5
    };
  }
  if (totalDonations >= 3) {
    return {
      level: 1,
      name: 'Rising Star',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      icon: 'Star',
      minDonations: 3
    };
  }
  return null;
}

export function formatBloodType(type: string | null): string {
  if (!type) return 'Unknown';
  return type;
}

export async function geocodeLocation(thana: string, district: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const query = encodeURIComponent(`${thana}, ${district}, Bangladesh`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BloodLinkBD-App/1.0 (titumirtlt@gmail.com)'
      }
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
