'''
FRI OCT 30, 2020
Stacy Bridges
'''
# Imports  ---------------------------------------------------------------------
import os, json, csv
import pandas as pd
from flask import Flask, render_template, send_file, request, redirect, jsonify

# App Config  ------------------------------------------------------------------
app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates"
)

app.config['SECRET_KEY'] = 'secret!'

# Helpers  ---------------------------------------------------------------------
def getFolderPath():
    return os.path.dirname(os.path.abspath(__file__))


def getLibFnames():
    return os.listdir(getFolderPath() + r'/static/lib')


def getChiSqr(observed, numOfVals):
    print('getChiSqr args: ', observed, numOfVals)
    # rem chiSqr =  x^2 =  Summation [ ( observed - expected )^2 / expected ]
    expected = [ .301, .176, .125, .097, .079, .067, .058, .051, .046 ]

    chisqr = 0
    for i in range(1,10):
        o = observed[i-1] * numOfVals
        e = expected[i-1] * numOfVals
        chisqr = chisqr + ( ( ( o - e ) ** 2 ) / e )

    return round(chisqr,2)


def get_timestamp():
    now_utc = datetime.now(timezone('UTC'))
    time = now_utc.astimezone(timezone('US/Central'))
    timestamp = time.strftime("%H%M%S")
    return(timestamp)


# URL Routes  ------------------------------------------------------------------
@app.route('/')
def home_page():
    return render_template('index.html')


@app.route('/getLibCsvMenu', methods=['POST'])
def getLibCsvMenu():
    print('getLibCsvMenu()')

    fnames = getLibFnames()
    return jsonify( { "libCsvMenu": fnames } )


@app.route('/getLibCsv', methods=['POST'])
def getLibCsv():
    print('getLibCsv()')

    filename = request.get_json()['params']
    libCsv = getFolderPath() + r'/static/lib/' + filename

    csvHeaders = []
    csvData = []
    csvFileSize = os.stat(libCsv).st_size

    with open(libCsv, encoding='utf8', mode='r')as file:
      data = csv.reader(file, delimiter='|')
      row = 0
      for record in data:
        if row == 0: csvHeaders = record
        else: csvData.append(record)
        row += 1

    dict = {
        "csvHeaders": csvHeaders,
        "csvData": csvData,
        "csvFileSize": csvFileSize
    }

    return jsonify( dict )


@app.route('/addCsvToLibrary', methods=['POST'])
def addCsvToLibrary():
    print('addCsvToLibrary()')

    # rem data object looks like: {'results': results.data, 'filename': self.csvFilename}
    data = request.get_json() # get data
    file = getFolderPath() + '/static/lib/' + data['filename']  # define save path

    csvfile = open(file, 'w', newline='')
    obj = csv.writer(csvfile, delimiter='|')
    for item in data['results']:
        obj.writerow(item)
    csvfile.close()

    return jsonify( {'msg': 'CSV was added to Library.'} )


@app.route('/getInclusionsReport/<string:time>')
def getInclusionsReport(time):
    print('getInclusionsReport', time)
    file = getFolderPath() + '/static/census_2009b.csv'
    return send_file(file, as_attachment=True)


@app.route('/getBenfordAnalysis', methods=['POST'])
def getBenfordAnalysis():
    data = request.get_json()                                       # get the data
    df = pd.DataFrame(data)                                         # make a dataframe

    stats = {}                                                      # create a blank object to capture stats
    stats['totRows'] = len(df.index)                                # get stat: tot rows in submitted column

    df['firstChar'] = df['params'].astype(str).str[0]               # make dataframe with a column of 1st chars
    df['included'] = df['params'].astype(str).str.match("^[1-9]")   # add column showing which 1st chars are digits 1 to 9
    df.to_csv(getFolderPath() + '/static/census_2009b.csv')     # save a csv showing which records were included in the analysis
    df.drop(df[df['included'] != True].index, inplace = True)       # now drop records that won't be analyzed

    stats['keptRows'] = len(df.index)                               # get stat: number of records kept in analysis
    stats['droppedRows'] = stats['totRows'] - stats['keptRows']     # get stat: number of records dropped from analysis

    # if any numerical 1st chars exist, then do the analysis:
    if stats['keptRows'] > 0:
        forAnalysis = pd.Series(df['firstChar'])                    # make the chars col into a series that can be analyzed
        bennySeries = pd.Series(df['firstChar'])                    # get a series of the numbers to be analyzed
        bennyVals = bennySeries.value_counts(normalize=True)        # get the dist vals
        bennyVals = bennyVals.round(decimals=3).tolist()            # round the dist vals to precision 3
        bennyIndex = bennySeries.value_counts().index.tolist()      # get a list of the indices in range (1,9)
                                                                    #   !! (the indices will allow us to correctly sort the dist vals below)

        # create response w/ dist vals sorted by index and return to requestor
        dist = []
        for i in range(1,10):
            if str(i) in bennyIndex:
                dist.append( bennyVals[ bennyIndex.index( str(i) ) ] )
            else:
                dist.append(0)

        # get the chi square statistic
        chisqr =  getChiSqr(dist, stats['keptRows'])

        # cast distribution values as percentages
        i = 0
        for val in dist:
            dist[i] = round(val * 100, 2);
            i += 1

        # bundle the stats and dist objects and return them as response to the requestor:
        response =  {
            "dist": dist,
            "stats": stats,
            "chisqr": chisqr
        }

    # if no numerical 1st chars exist, don't do the analysis:
    else:
        response = {
            "dist": [0,0,0,0,0,0,0,0,0],
            "stats": stats,
            "chisqr": 9999
        }

    # -------------------- test
    # print('dataframe:\n', df)
    # print('totRows: ', response['stats']['totRows'])
    # print('keptRows: ', response['stats']['keptRows'])
    # print('rejectRows: ', response['stats']['droppedRows'])
    # print('dist: ', response['dist'])
    # print('chisqr: ', response['chisqr'])
    # --------------------

    return jsonify(response)


if __name__ == '__main__' :
    # app.run()
    app.run(host="0.0.0.0",port=80)
