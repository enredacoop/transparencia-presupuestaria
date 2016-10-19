#!/usr/bin/python
# -*- coding: utf-8 -*-
import csv
import json
import argparse
__author__ = 'enreda'

def parseFloat(val):
    return float(val.replace(",",""))


parser = argparse.ArgumentParser(description='Budget parser created by Enreda Co-operative')
parser.add_argument('-i','--input', help='CSV budget file input name',required=True)
parser.add_argument('-t','--type', help='Budget type (incomes or expenses)',required=True)
parser.add_argument('-y','--year', help='Budget year (4 digits)',required=True)
args = parser.parse_args() 

fileinput = open(args.input, "rb")
csvoutput = open(args.type+args.year+".csv", "w")
csvwriter = csv.writer(csvoutput, delimiter=',', quotechar='"')
csvwriter.writerow([ "code","name","value", "observations" ])
raw_data = csv.reader(fileinput)
raw_data = [row for row in raw_data]
budget_type = "Ingresos" if args.type == "incomes" else "Gastos"
clean_data = {"name": budget_type + " " + args.year, "code": "0", "children": []}
i=ii=iii=-1
for index, line in enumerate(raw_data):
    name = line[4].capitalize()
    code = line[0] if line[0] is not '' else (line[1] if line[1] is not '' else (line[2] if line[2] is not '' else (line[3] if line[3] is not '' else '')))
    csvwriter.writerow([ code, name, parseFloat(line[5]), '' ])
    if parseFloat(line[5]) != 0:
        if line[0] is not '':
            clean_data["children"].append({"name": name, "code": line[0], "children": []})
            i+=1
            ii=iii=-1
        else:
            if line[1] is not '':
                if index < len(raw_data)-1:
                    if raw_data[index+1][2] is not '':
                        clean_data["children"][i]["children"].append({"name": name, "code": line[1], "children": []})
                    else:
                        clean_data["children"][i]["children"].append({"name": name, "code": line[1], "value": parseFloat(line[5])})
                else:
                    clean_data["children"][i]["children"].append({"name": name, "code": line[1], "value": parseFloat(line[5])})
                ii+=1
                iii=-1
            else:
                if line[2] is not '':
                    if index < len(raw_data)-1:
                        if raw_data[index+1][3] is not '':
                            clean_data["children"][i]["children"][ii]["children"].append({"name": name, "code": line[2], "children": [] })
                        else:
                            clean_data["children"][i]["children"][ii]["children"].append({"name": name, "code": line[2], "value": parseFloat(line[5])})
                    else:
                        clean_data["children"][i]["children"][ii]["children"].append({"name": name, "code": line[2], "value": parseFloat(line[5])})
                    iii+=1
                else:
                    if line[3] is not '':
                        clean_data["children"][i]["children"][ii]["children"][iii]["children"].append({"name": name, "code": line[3], "value": parseFloat(line[5])})


fileoutput = open(args.type+args.year+".json", "w")
fileoutput.write(json.dumps(clean_data))
fileoutput.close()
csvoutput.close()
