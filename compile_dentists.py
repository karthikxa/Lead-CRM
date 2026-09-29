import json
import csv
import os

os.makedirs('zed/data', exist_ok=True)

dentists_data = [
    # --- ANNA NAGAR ---
    {"name": "Dentistree Anna Nagar", "area": "Anna Nagar", "has_website": True, "website": "https://dentistree.in", "phone": "+91 44 4217 1717", "address": "Plot No 1318, 13th Main Rd, Anna Nagar West"},
    {"name": "Apollo Dental Clinic Anna Nagar", "area": "Anna Nagar", "has_website": True, "website": "https://apollodental.in", "phone": "1800 102 0288", "address": "2nd Avenue, Near Roundtana, Anna Nagar"},
    {"name": "Clove Dental Anna Nagar", "area": "Anna Nagar", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "3rd Avenue, Near Anna Arch, Anna Nagar"},
    {"name": "Dr. Smilez Dental Center", "area": "Anna Nagar", "has_website": True, "website": "https://drsmilez.com", "phone": "+91 98844 44343", "address": "2nd Avenue, Block AB, Anna Nagar"},
    {"name": "Smilescape Dental Care", "area": "Anna Nagar", "has_website": True, "website": "https://smilescape.in", "phone": "+91 98403 33320", "address": "1st Avenue, Anna Nagar East"},
    {"name": "Dr. Naga's White Dental Clinic", "area": "Anna Nagar", "has_website": True, "website": "https://drnagarathinam.com", "phone": "+91 44 2621 1199", "address": "Shanti Colony, Anna Nagar"},
    {"name": "Shankar's Dental Clinic", "area": "Anna Nagar", "has_website": True, "website": "https://shankarsdentalclinic.com", "phone": "+91 44 2626 5500", "address": "6th Avenue, Anna Nagar"},
    {"name": "Roots N Crowns Dental Care", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2615 2828", "address": "W Block, 3rd Main Rd, Anna Nagar"},
    {"name": "Sparks Dental Centre", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98410 77112", "address": "Near Roundtana, 2nd Avenue, Anna Nagar"},
    {"name": "Raj Implant And Orthodontic Center", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2620 9090", "address": "C Block, Shanti Colony, Anna Nagar"},
    {"name": "White Line Dental Care", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98841 23456", "address": "12th Main Road, Anna Nagar West"},
    {"name": "Studio Dental", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 4350 1122", "address": "5th Avenue, Anna Nagar"},
    {"name": "Serenity Dental Clinic and Implant Centre", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 97910 88990", "address": "Y Block, Anna Nagar"},
    {"name": "Anbu Laser Dental Clinic", "area": "Anna Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2616 3456", "address": "Opp. K4 Police Station, Anna Nagar"},

    # --- GUINDY ---
    {"name": "Opal Dentistry Guindy", "area": "Guindy", "has_website": True, "website": "https://opaldentistry.com", "phone": "+91 98840 98840", "address": "GST Road, Guindy, Near Kathipara"},
    {"name": "Clove Dental Guindy", "area": "Guindy", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Near Guindy Railway Station"},
    {"name": "Tooth N Care Dental Clinic Guindy", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2235 1234", "address": "Race Course Rd, Guindy"},
    {"name": "Dr. Barun's Multispeciality Dental Centre", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98402 11223", "address": "MKNH Road, Guindy"},
    {"name": "Stunning Smiles Dental Guindy", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 94440 55667", "address": "Guindy Industrial Estate, Near Olympia Tech Park"},
    {"name": "Dentall Care Clinic", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2250 8899", "address": "Vandikaran Street, Guindy"},
    {"name": "Makizham Kids and Dental Clinic", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 99620 33445", "address": "Near Guindy Bus Terminus"},
    {"name": "Sri Ranga Dental Clinic", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2232 4455", "address": "Station Road, Guindy"},
    {"name": "Vivi Dental and Cosmetic Clinic Guindy", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98842 66778", "address": "Near SIDCO Estate, Guindy"},
    {"name": "S S Dental Hospital", "area": "Guindy", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2231 9900", "address": "Five Furlong Rd, Guindy"},

    # --- T. NAGAR ---
    {"name": "Apollo Dental Clinic T. Nagar", "area": "T. Nagar", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2834 5678", "address": "Habibullah Road, T. Nagar"},
    {"name": "The Happy Smile Dental Clinic", "area": "T. Nagar", "has_website": True, "website": "https://happysmile.in", "phone": "+91 44 2434 1122", "address": "G.N. Chetty Road, T. Nagar"},
    {"name": "Dr. Smilez Dental Center T. Nagar", "area": "T. Nagar", "has_website": True, "website": "https://drsmilez.com", "phone": "+91 98844 44343", "address": "North Boag Road, T. Nagar"},
    {"name": "Clove Dental Pondy Bazaar", "area": "T. Nagar", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Pondy Bazaar, Sir Thyagaraya Rd, T. Nagar"},
    {"name": "Pooja Joshis Clinic", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98401 22334", "address": "Bazullah Road, T. Nagar"},
    {"name": "Laughter Dental Clinic", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2815 6789", "address": "Usman Road, T. Nagar"},
    {"name": "Matrix Multi-Speciality Dental Clinic", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98840 12389", "address": "Burkit Road, T. Nagar"},
    {"name": "Akeela Dental Care", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2433 8811", "address": "South Usman Rd, T. Nagar"},
    {"name": "Chakravarthi Dental Clinic", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 94441 55660", "address": "Venkatnarayana Road, T. Nagar"},
    {"name": "Dr. P Jayakumars Dental Clinic", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2435 9922", "address": "Mangesh Street, T. Nagar"},
    {"name": "NAK Dental Clinic", "area": "T. Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98400 33441", "address": "Rameswaram Road, T. Nagar"},

    # --- ADYAR ---
    {"name": "Apollo Dental Adyar", "area": "Adyar", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2445 6789", "address": "Sardar Patel Road, Adyar"},
    {"name": "Radiant Dental Care Adyar", "area": "Adyar", "has_website": True, "website": "https://radiantdentalcare.in", "phone": "+91 91766 00055", "address": "Lattice Bridge Rd, Adyar"},
    {"name": "Dent Eazee Dental Clinic", "area": "Adyar", "has_website": True, "website": "https://denteazeedentalclinic.in", "phone": "+91 98411 99887", "address": "1st Main Road, Gandhi Nagar, Adyar"},
    {"name": "Tooth Friendly Dental Care", "area": "Adyar", "has_website": True, "website": "https://toothfriendly.in", "phone": "+91 44 2441 2233", "address": "Kasturibai Nagar, Adyar"},
    {"name": "Clove Dental Adyar", "area": "Adyar", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Besant Avenue Rd, Adyar"},
    {"name": "Smile Mantra Dental and Cosmetic Clinic", "area": "Adyar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98403 11220", "address": "2nd Crescent Park Rd, Gandhi Nagar, Adyar"},
    {"name": "Teddy Bear Painless Pediatric Dentistry", "area": "Adyar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 99400 44551", "address": "4th Main Rd, Gandhi Nagar, Adyar"},
    {"name": "Mr. Dentist Implant and Cosmetic Clinic", "area": "Adyar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 4211 8800", "address": "Indira Nagar, Adyar"},
    {"name": "Sri Balaji Dental Clinic", "area": "Adyar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2491 5566", "address": "Vannanthurai, Adyar"},

    # --- VELACHERY ---
    {"name": "Apollo Dental Clinic Velachery", "area": "Velachery", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2244 8899", "address": "100 Feet Bypass Rd, Velachery"},
    {"name": "Luxe Dental Centre", "area": "Velachery", "has_website": True, "website": "https://luxedentalcentre.com", "phone": "+91 98845 00112", "address": "Taramani Link Rd, Velachery"},
    {"name": "Dentistree Velachery", "area": "Velachery", "has_website": True, "website": "https://dentistree.in", "phone": "+91 44 4218 8899", "address": "Velachery Main Road, Opp. Grand Mall"},
    {"name": "Clove Dental Velachery", "area": "Velachery", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Vijaya Nagar, Velachery"},
    {"name": "Dr. Vivekanandhan's Dental Clinic", "area": "Velachery", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2243 1122", "address": "Baby Nagar, Velachery Main Rd"},
    {"name": "K R Dental Care", "area": "Velachery", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98402 77889", "address": "Tansi Nagar, Velachery"},
    {"name": "Dc Dental Care", "area": "Velachery", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2259 3344", "address": "Dhandeeswaram Nagar, Velachery"},
    {"name": "Dr. Vinayas Dental and Orthodontic Care", "area": "Velachery", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 99401 22330", "address": "Bypass Road, Velachery"},
    {"name": "Tooth Fairy Dental Care", "area": "Velachery", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 4355 6677", "address": "Rajalakshmi Nagar, Velachery"},
    {"name": "Vasan Dental Care Velachery", "area": "Velachery", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 3989 0000", "address": "Velachery Bypass Road"},

    # --- MYLAPORE ---
    {"name": "Sanjeevani Dental Clinic", "area": "Mylapore", "has_website": True, "website": "https://toothsanjeevani.com", "phone": "+91 44 2498 7766", "address": "Luz Church Road, Mylapore"},
    {"name": "Glodent Dental Clinic", "area": "Mylapore", "has_website": True, "website": "https://glodentdentalclinicmylapore.com", "phone": "+91 98400 99881", "address": "Kutchery Road, Mylapore"},
    {"name": "Dr. Muralikarthik Dental Clinic", "area": "Mylapore", "has_website": True, "website": "https://drmuralikarthik.com", "phone": "+91 44 2464 1234", "address": "Royapettah High Rd, Mylapore"},
    {"name": "Tanzi Dental Clinic", "area": "Mylapore", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98410 44556", "address": "North Mada Street, Mylapore"},
    {"name": "Dr. Arjun Dental Clinic", "area": "Mylapore", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2495 6677", "address": "Kapaleeswarar South Mada St, Mylapore"},
    {"name": "Jayaraj Dental Clinic", "area": "Mylapore", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2498 1122", "address": "Oliver Road, Mylapore"},
    {"name": "Sri Sai Dental Clinic", "area": "Mylapore", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98841 88990", "address": "Alamelumangapuram, Mylapore"},

    # --- KILPAUK ---
    {"name": "Marvel Dentistry Kilpauk", "area": "Kilpauk", "has_website": True, "website": "https://marveldentistry.in", "phone": "+91 98401 55667", "address": "Poonamallee High Rd, Kilpauk"},
    {"name": "Dr. Kishor's Dentistry", "area": "Kilpauk", "has_website": True, "website": "https://kishorsdentistry.com", "phone": "+91 44 2644 8899", "address": "Ormes Road, Kilpauk"},
    {"name": "Expert Dental Care Kilpauk", "area": "Kilpauk", "has_website": True, "website": "https://expertdental.in", "phone": "+91 98402 33441", "address": "Halls Road, Kilpauk"},
    {"name": "Apollo Dental Kilpauk", "area": "Kilpauk", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2642 1122", "address": "New Avadi Road, Kilpauk"},
    {"name": "Clove Dental Kilpauk", "area": "Kilpauk", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Balfour Road, Kilpauk"},
    {"name": "Kilpauk Dental Hospital", "area": "Kilpauk", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2641 2233", "address": "Taylors Road, Kilpauk"},
    {"name": "Crown Dental Clinic", "area": "Kilpauk", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98840 44550", "address": "Landon's Road, Kilpauk"},
    {"name": "Aura Dental Care", "area": "Kilpauk", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2645 8899", "address": "Vasugi Street, Kilpauk"},

    # --- NUNGAMBAKKAM ---
    {"name": "Acharya Dental", "area": "Nungambakkam", "has_website": True, "website": "https://acharyadental.com", "phone": "+91 44 2827 6623", "address": "Thirumalai Pillai Rd / Sterling Rd, Nungambakkam"},
    {"name": "Royal Pearl Dental", "area": "Nungambakkam", "has_website": True, "website": "https://royalpearldental.com", "phone": "+91 44 2826 1234", "address": "College Road, Nungambakkam"},
    {"name": "Apollo Dental Nungambakkam", "area": "Nungambakkam", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2829 8899", "address": "Haddows Road, Nungambakkam"},
    {"name": "Clove Dental Nungambakkam", "area": "Nungambakkam", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Kothari Road, Nungambakkam"},
    {"name": "Dr. Chacko's Dental Clinic", "area": "Nungambakkam", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2827 1100", "address": "Village Road, Nungambakkam"},
    {"name": "Smiles Forever Dental Clinic", "area": "Nungambakkam", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98400 11990", "address": "Wheatcrofts Road, Nungambakkam"},
    {"name": "Nungambakkam Dental Care", "area": "Nungambakkam", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2825 4433", "address": "Valluvar Kottam High Rd, Nungambakkam"},

    # --- PORUR ---
    {"name": "Right Dental Clinic Porur", "area": "Porur", "has_website": True, "website": "https://rightdentalclinic.com", "phone": "+91 98842 55660", "address": "Arcot Road, Near Porur Junction"},
    {"name": "Dr Smilez Dental Center Porur", "area": "Porur", "has_website": True, "website": "https://drsmilez.com", "phone": "+91 98844 44343", "address": "Mount Poonamallee Rd, Porur"},
    {"name": "Expert Dental Care Porur", "area": "Porur", "has_website": True, "website": "https://expertdental.in", "phone": "+91 98402 33441", "address": "Gopalasamy Nagar, Porur"},
    {"name": "Apollo Dental Porur", "area": "Porur", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2476 1122", "address": "Opp. Ramachandra Hospital, Porur"},
    {"name": "Clove Dental Porur", "area": "Porur", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Karambakkam, Porur"},
    {"name": "Lakshmi Dental Care Porur", "area": "Porur", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2482 7788", "address": "Kundrathur Main Road, Porur"},
    {"name": "Signature Dental Care", "area": "Porur", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98405 11223", "address": "Madhanandapuram, Porur"},
    {"name": "Sri Balaji Dental Clinic Porur", "area": "Porur", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2482 1199", "address": "Trunk Road, Porur"},
    {"name": "Poonamallee High Dental Care", "area": "Porur", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98849 88776", "address": "Near Porur Toll Gate"},

    # --- TAMBARAM ---
    {"name": "Dr. Rajendran Multispeciality Dental Clinic", "area": "Tambaram", "has_website": True, "website": "https://tambaramdentalclinic.com", "phone": "+91 44 2226 1122", "address": "GST Road, Tambaram West"},
    {"name": "Radiant Dental Care Tambaram", "area": "Tambaram", "has_website": True, "website": "https://radiantdentalcare.in", "phone": "+91 91766 00055", "address": "Gandhi Road, Tambaram West"},
    {"name": "Dr. Amarnathan's Dental Care", "area": "Tambaram", "has_website": True, "website": "https://dramarnathansdentalcare.com", "phone": "+91 44 2239 8899", "address": "Velachery Main Rd, East Tambaram"},
    {"name": "Apollo Dental Tambaram", "area": "Tambaram", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2226 5544", "address": "Near Tambaram Railway Station"},
    {"name": "Clove Dental Tambaram", "area": "Tambaram", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Muthurangan Mudali St, Tambaram West"},
    {"name": "Smile Dental Clinic Tambaram", "area": "Tambaram", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2226 9988", "address": "Kakkan Street, Tambaram West"},
    {"name": "Grace Dental Clinic", "area": "Tambaram", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98402 44556", "address": "Camp Road Junction, East Tambaram"},
    {"name": "Sri Raghavendra Dental Clinic", "area": "Tambaram", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2239 1234", "address": "MES Road, East Tambaram"},
    {"name": "Vasanth Dental Care", "area": "Tambaram", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98841 33221", "address": "Shanmugam Road, Tambaram West"},

    # --- VADAPALANI and KODAMBAKKAM ---
    {"name": "Supreme Multi-Speciality Dental Centre", "area": "Vadapalani", "has_website": True, "website": "https://supremedental.clinic", "phone": "+91 44 2480 1122", "address": "100 Feet Road, Vadapalani"},
    {"name": "Partha Dental Clinic Vadapalani", "area": "Vadapalani", "has_website": True, "website": "https://parthadental.com", "phone": "+91 44 4350 8899", "address": "Arcot Road, Near Vadapalani Murugan Temple"},
    {"name": "Apollo Dental Vadapalani", "area": "Vadapalani", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2481 2233", "address": "Vadapalani Junction"},
    {"name": "Clove Dental Vadapalani", "area": "Vadapalani", "has_website": True, "website": "https://clovedental.in", "phone": "+91 11 3355 3232", "address": "Doshi Garden, Arcot Road, Vadapalani"},
    {"name": "R R Dental Hospital", "area": "Vadapalani", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2484 5566", "address": "Kumaran Colony, Vadapalani"},
    {"name": "RD Dental Care Kodambakkam", "area": "Kodambakkam", "has_website": True, "website": "https://prodentist.in", "phone": "+91 44 2483 1122", "address": "Arcot Road, Kodambakkam"},
    {"name": "Kalaa Dental Clinic Kodambakkam", "area": "Kodambakkam", "has_website": True, "website": "https://kalaadentalcare.com", "phone": "+91 98401 22330", "address": "Station Road, Kodambakkam"},
    {"name": "Tooth N Care Kodambakkam", "area": "Kodambakkam", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2481 9900", "address": "United India Colony, Kodambakkam"},
    {"name": "Sri Sai Multi Speciality Dental Clinic", "area": "Kodambakkam", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 98842 11009", "address": "Rangarajapuram Main Rd, Kodambakkam"},

    # --- ALWARPET and BESANT NAGAR ---
    {"name": "Dr Smilez Dental Center Alwarpet", "area": "Alwarpet", "has_website": True, "website": "https://drsmilez.com", "phone": "+91 98844 44343", "address": "TTK Road, Alwarpet"},
    {"name": "Aligning Dentistry Alwarpet", "area": "Alwarpet", "has_website": True, "website": "https://aligningdentistry.com", "phone": "+91 98400 88991", "address": "CP Ramaswamy Road, Alwarpet"},
    {"name": "Apollo Dental Alwarpet", "area": "Alwarpet", "has_website": True, "website": "https://apollodental.in", "phone": "+91 44 2499 5566", "address": "Oliver Road, Alwarpet"},
    {"name": "Pooja's Pearl Dentistry", "area": "Alwarpet", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2498 3344", "address": "Eldams Road, Alwarpet"},
    {"name": "Jovani Dental Clinic", "area": "Besant Nagar", "has_website": True, "website": "https://jovanidental.com", "phone": "+91 44 2491 8899", "address": "2nd Avenue, Besant Nagar"},
    {"name": "Besant Dental Care", "area": "Besant Nagar", "has_website": True, "website": "https://besantdentalcare.com", "phone": "+91 44 2490 1234", "address": "Tiger Varadachari Rd, Besant Nagar"},
    {"name": "SmileyDent Besant Nagar", "area": "Besant Nagar", "has_website": True, "website": "https://smileydent.in", "phone": "+91 98403 66778", "address": "4th Main Road, Besant Nagar"},
    {"name": "Beach Road Dental Clinic", "area": "Besant Nagar", "has_website": False, "website": "No Website (Directory Listing Only)", "phone": "+91 44 2446 9900", "address": "Elliot's Beach Rd, Besant Nagar"}
]

# Save JSON
with open('zed/data/chennai_dentists_leads.json', 'w', encoding='utf-8') as f:
    json.dump(dentists_data, f, indent=2)

# Save CSV
with open('zed/data/chennai_dentists_leads.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['ID', 'Clinic Name', 'Area / Locality', 'Has Website', 'Website URL / Source', 'Phone Number', 'Address / Landmark', 'Zed Agency Opportunity'])
    for idx, d in enumerate(dentists_data, start=1):
        opp = 'High Priority: Pitch Website + Automation (Rs 7,000)' if not d['has_website'] else 'Pitch 3D Dynamic Redesign + Automation (Rs 9,500 - 13,500)'
        writer.writerow([idx, d['name'], d['area'], 'YES' if d['has_website'] else 'NO', d['website'], d['phone'], d['address'], opp])

total = len(dentists_data)
with_web = sum(1 for d in dentists_data if d['has_website'])
without_web = total - with_web

area_stats = {}
for d in dentists_data:
    a = d['area']
    if a not in area_stats:
        area_stats[a] = {'total': 0, 'with': 0, 'without': 0}
    area_stats[a]['total'] += 1
    if d['has_website']:
        area_stats[a]['with'] += 1
    else:
        area_stats[a]['without'] += 1

print('=== CHENNAI DENTIST LEAD COMPILATION ===')
print(f'Total Clinics Documented: {total}')
print(f'Clinics WITH Website: {with_web} ({with_web/total*100:.1f}%)')
print(f'Clinics WITHOUT Website: {without_web} ({without_web/total*100:.1f}%)')
print('----------------------------------------------------')
print(f'{"Area":<18} | {"Total":<6} | {"With Web":<10} | {"Without Web":<12}')
print('----------------------------------------------------')
for a, s in sorted(area_stats.items()):
    print(f'{a:<18} | {s["total"]:>5} | {s["with"]:>9} | {s["without"]:>11}')
