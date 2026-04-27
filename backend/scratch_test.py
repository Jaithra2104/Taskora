import re

extracted_text = """Prerequisites:

1. A caurse on "Databhane Managoment Systame"
2. Koowlodgo oć probabiity and statistic.

Course Objectives:
. To esplere the fandamestal conoepts of dita nnalykcs.
. To leam the principles and methods of saristical analysls.
. Discover lnvesting pottems, asalyze saporvised and umupervied model, and estimbe the
accuracy of the algorithre.
To usderstand the varings search racthods and vissakzatin tocariaes.

Course Outcomes:

Adhes conglebon of this course, soodasis will be able oo

. Undarstaad the imact of data azolytics for bosiness deciioas and straorgy.
Carry cut data analysis'statistical arlysis
. Catry cut standard data vasualliratioa and foczal aneecace procoduzes.
.
Desge Data Aschitectare.
. Undastasd varioe Data Soarces

UNIT-1
Data Management: Desigo Data Archiecize and mnage the dasa foe arlysis,
understand various sources of Data Ake Sensors Sigsals/Gl'S ek. Duta Management, Data
Quality (ncise, outliers, mining values, daplicate data) and Data Processing &
Processing.

Data Analyties: Iatroductioa to Acalyties, Imoductioe to Tools and Eavirosaitt,
Application of Modeling in Business, Data bases &Types of Data and Variahles, Dura
Modclieg Techriques, Miing Easputationa ete. Need for Besiaess Modeling.
UNIT-IE
Regression-Concepts, Mae propeity assumptions, Least Square Estimation.
Variable Ratinnalization, and Model Ruilding eic.
Logistic Regression: Model Theery. Model fit Ssatistics, Model Comeruction,
Analytics applications to vaaious Business Domaias ete.

4/22

AVN
UNIT-IV
Object Seguwntation: Regreiion Va Segmentation - Sepervised and Umsupervied
Leamisg, Tree Beilding - Regresioa, Clasification, over fising. Peuning and Complexits,
Muhiple Dechion Trees eto. Time Serles Methods: Arima, Mcaseres of Porecast
Acceracy, STL

Appeusch, Extract Seatures froen geacrated model as Height, Avgrage Eacrgy rtc and
Analyse fex prediction

UNIT-V
Data Visualization: Pisel-Oriested Visualization Techniques, Geometri Projection
Visaaliratica Tochaiqacs, Icon-Based Vinualization Techniqaes, Hicrarchical
Visaaliratioa Tecbnigues, Visualizing Cocaples Data and Relatians.

TEXTBOOKS:
E. Stodenit's Hand book for Assocate Aralytks-I1. III.
2. Data Mining Concepes asd Techniqaes, Han, Kamber, 3rdEdiioa, Mergas
Kaufmare Publishers.
REFERENCEBOOKS:
L. Iocoductios to Data Miniag, Tan, SteinbochaadKamar.AddnionWisley,2006
2. Data Mining Analyais and Concepes, M. Zaki and W.Meira
3. Minieg of Massave Dalanets, Jure Leskovee Stanford Univ. Anand Rajarsenan
Milliway Labs Joffrey D UEman Stacferd Univ.

INSTITUTE OF
ENGINEERING & TECHNOLOGY
Arr udud by NAAC & N&A

NBA

A
NAAG"""

lines = [line.strip() for line in extracted_text.split('\n') if line.strip() and len(line.strip()) > 2]
topics_to_add = []
for i, line in enumerate(lines):
    lower_line = line.lower()
    
    # 1. Check if line starts with UNIT or MODULE
    if re.search(r'^(unit|module)[\s\-]*[ivx0-9]+', lower_line):
        parts = re.split(r'^(unit|module)[\s\-]*[ivx0-9]+[\s\:\-\.]*', lower_line, flags=re.IGNORECASE)
        if len(parts) > 2 and len(parts[2].strip()) > 3:
             topic = line[len(line) - len(parts[2]):].split(':')[0].strip()
             topics_to_add.append(topic)
        elif i + 1 < len(lines):
             topic = lines[i+1].split(':')[0].strip()
             topics_to_add.append(topic)
             
    # 2. Look for patterns like "Topic Name:"
    elif ":" in line:
        topic_name = line.split(":")[0].strip()
        if len(topic_name.split()) <= 5: # likely a topic header
            ignore_list = ["prerequisites", "course objectives", "course outcomes", "textbooks", "referencebooks", "reference books", "references"]
            if topic_name.lower() not in ignore_list and topic_name.lower() not in [t.lower() for t in topics_to_add]:
                topics_to_add.append(topic_name)

unique_topics = []
for t in topics_to_add:
    clean_t = re.sub(r'^[\d\.\-\*\s]+', '', t).strip()
    if len(clean_t) > 3 and clean_t not in unique_topics:
        unique_topics.append(clean_t)

print("UNIQUE TOPICS:", unique_topics)
