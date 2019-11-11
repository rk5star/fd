import io
import os
import base64
import sys
#sys.path.append("/app/.heroku/opencv/lib/python3.6/site-packages")
import cv2   
import numpy as np

from io import BytesIO
from base64 import b64decode
import tensorflow as tf
from PIL import Image
from django.core.files.temp import NamedTemporaryFile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render

MAX_K = 10
dir_path=os.getcwd()

TF_GRAPH = "{base_path}/inception_model/retrained_graph.pb".format(
    base_path=os.path.abspath(os.path.dirname(__file__)))
TF_LABELS = "{base_path}/inception_model/retrained_labels.txt".format(
    base_path=os.path.abspath(os.path.dirname(__file__)))


def load_graph():
    sess = tf.Session()
    with tf.gfile.FastGFile(TF_GRAPH, 'rb') as tf_graph:
        graph_def = tf.GraphDef()
        graph_def.ParseFromString(tf_graph.read())
        tf.import_graph_def(graph_def, name='')
    label_lines = [line.rstrip() for line in tf.gfile.GFile(TF_LABELS)]
    softmax_tensor = sess.graph.get_tensor_by_name('final_result:0')
    return sess, softmax_tensor, label_lines


SESS, GRAPH_TENSOR, LABELS = load_graph()


im=None

@csrf_exempt
def classify_api(request):
    data = {"success": False}
    TotalData=None

    if request.method == "POST":
        tmp_f = NamedTemporaryFile()

        if request.FILES.get("image", None) is not None:
            image_request = request.FILES["image"]
            image_bytes = image_request.read()
            image = Image.open(io.BytesIO(image_bytes))
            image.save(tmp_f, image.format)
        elif request.POST.get("image64", None) is not None:
            base64_data = request.POST.get("image64", None).split(',', 1)[1]
            plain_data = b64decode(base64_data)
            tmp_f.write(plain_data)
            try:
                
                im=Image.open(BytesIO(plain_data))
                
                
                im.save('bottleImage1.jpg','JPEG')
                
                
                #print(checkBlueColor(im))
            except Exception as ex:
                template = "An exception of type {0} occurred. Arguments:\n{1!r}"
                message = template.format(type(ex).__name__, ex.args)
                print(message)
            
        

        classify_result = tf_classify(tmp_f, int(request.POST.get('k', MAX_K)))
        tmp_f.close()
        if checkRedColor(im)=='Yes':
            data["red_color"]="Yes"
        else:
            data["red_color"]="No"
        if checkBlueColor(im)=='Yes':
            data["blue_color"]="Yes"
        else:
            data["blue_color"]="No"

        if classify_result:
            data["success"] = True
            
            data["confidence"] = {}
            for res in classify_result:
                data["confidence"][res[0]] = float(res[1])
                print("Confidence is")
                print(data["confidence"][res[0]])
        #else:
        #    data["success"]= False
            
    

    return JsonResponse(data)


def classify(request):
    return render(request, 'classify.html', {})
    #return render(request, 'classify.html', context)


# noinspection PyUnresolvedReferences
def tf_classify(image_file, k=MAX_K):
    result = list()

    image_data = tf.gfile.FastGFile(image_file.name, 'rb').read()

    predictions = SESS.run(GRAPH_TENSOR, {'DecodeJpeg/contents:0': image_data})
    predictions = predictions[0][:len(LABELS)]
    top_k = predictions.argsort()[-k:][::-1]
    for node_id in top_k:
        label_string = LABELS[node_id]
        score = predictions[node_id]
        result.append([label_string, score])

    return result


def checkBlueColor(imgb64):
    #print('ck blue color')
    #imgpath=readb64(imgb64)
    #print('impath called')
    #print(imgb64)
    open_cvIm=np.array(imgb64)
    #print('opencv_im')
    frame = cv2.imread('bottleImage1.jpg')
    #print('frame set')
    img = frame
    #print('frame assigned to img')
    #print(frame)

    #convert BGR to HSV
    try:
        hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
    
    #print('hsv set')
    #define Range of colors
    blue_lower=np.array([99,115,150],np.uint8)
    blue_upper=np.array([110,255,255],np.uint8)
    #print('limit set')


    blue=cv2.inRange(hsv,blue_lower,blue_upper)
    kernal = np.ones((5 ,5), "uint8")
    #print("kernal done")

    #find blue contours
    blue=cv2.dilate(blue,kernal)
    res1=cv2.bitwise_and(img, img, mask = blue)
    contours,hierarch=cv2.findContours(blue,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
    
    count=0
    ImgBlueStat="no"
    #print file path for no blue detect. 
    if(contours==[]):
        #print(imgPath)
        return "No"
    else:
        for pic, contour in enumerate(contours):
            
            area = cv2.contourArea(contour)
            
            if(area>100):
                
                if(count==0):

                    #print fpath and yes only once.
                    #print("yes")
                    count=count+1
                    return "Yes"
                
                x,y,w,h = cv2.boundingRect(contour)	
                img = cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
                cv2.putText(img,"Blue color",(x,y),cv2.FONT_HERSHEY_SIMPLEX, 0.7, (150,0,0))


def checkRedColor(imgb64):
    #print('ck red color')
    #imgpath=readb64(imgb64)
    #print('impath called')
    #print(imgb64)
    open_cvIm=np.array(imgb64)
    #print('opencv_im')
    frame = cv2.imread('bottleImage1.jpg')
    #print('frame set')
    img = frame
    #print('frame assigned to img')
    #print(frame)

    #convert BGR to HSV
    try:
        hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
    
    #print('hsv set')
    #define Range of colors # Red color
##    red_lower=np.array([0,100,0],np.uint8)
##    red_upper=np.array([10,255,255],np.uint8)
##    red_lower=np.array([0,0,255],np.uint8)
##    red_upper=np.array([0,0,153],np.uint8)
    red_lower=np.array([136,87,111],np.uint8)
    red_upper=np.array([180,255,255],np.uint8)
    #print('limit set')


    red=cv2.inRange(hsv,red_lower,red_upper)
    kernal = np.ones((5 ,5), "uint8")
    #print("kernal done")

    #find red contours
    red=cv2.dilate(red,kernal)
    res1=cv2.bitwise_and(img, img, mask = red)
    contours,hierarchy=cv2.findContours(red,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
    
    count=0
    ImgRedStat="no"
    #print file path for no red detect. 
    if(contours==[]):
        #print(imgPath)
        return "No"
    else:
        for pic, contour in enumerate(contours):
            
            area = cv2.contourArea(contour)
            
            if(area>300):
                
                if(count==0):

                    #print fpath and yes only once.
                    #print("yes")
                    count=count+1
                    return "Yes"
                
                x,y,w,h = cv2.boundingRect(contour)	
                img = cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
                cv2.putText(img,"Red color",(x,y),cv2.FONT_HERSHEY_SIMPLEX, 0.7, (150,0,0))




