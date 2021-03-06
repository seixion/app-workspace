Workspace.controller('AnnotationDetailsCtrl', [
  '$rootScope', '$scope', '$stateParams', '$timeout', 'annotationService', 'fabricJsService', 'annotationSocket', function($rootScope, $scope, $stateParams, $timeout, annotationService, fabricJsService, annotationSocket) {
    var commentPin, getSelf, metaUser, readyToComment, toolkit, usefulKeys;
    $rootScope.$broadcast('navigatedTo', 'Annotations');
    annotationSocket.forward('newCommentAddedResponse', $scope);
    $scope.selectable = false;
    $scope.canSelect = function() {
      return $scope.selectable;
    };
    $scope.colorpicker = {
      hex: '#ddd'
    };
    $scope.brushWidth = 5;
    $scope.mouseDown = null;
    $scope.left = 0;
    $scope.top = 0;
    $scope.currentCommentIndex = 1;
    $scope.newCommentText = null;
    $scope.annotations = [];
    metaUser = {
      type: 'normal',
      name: 'Rob',
      email: md5('jrchipman1@gmail.com')
    };
    $scope.currentUser = metaUser;
    $scope.shapeToolType = 'circle';
    $scope.thumbs = [
      {
        name: 'Maybe Art',
        src: 'img/BlueBus.jpg',
        id: 104
      }, {
        name: 'Stupid Art',
        src: 'img/ForMom.jpg',
        id: 101
      }, {
        name: 'Nice Art',
        src: 'img/FenceDog.jpg',
        id: 102
      }, {
        name: 'Great Art',
        src: 'img/TigerTug.jpg',
        id: 103
      }
    ];
    getSelf = function(name) {
      return _.find(toolkit, {
        name: name
      });
    };
    toolkit = [
      {
        name: 'disabled',
        properties: {
          isDrawingMode: false
        },
        annotating: false
      }, {
        name: 'draw',
        properties: {
          isDrawingMode: true
        },
        annotating: true
      }, {
        name: 'move',
        properties: {
          isDrawingMode: false
        },
        annotating: false
      }, {
        name: 'shape',
        properties: {
          isDrawingMode: false
        },
        annotating: true,
        type: 'circle',
        types: [
          {
            name: 'circle',
            type: fabric.Circle,
            blank: {
              radius: 1,
              strokeWidth: 5,
              stroke: $scope.colorpicker.hex,
              selectable: false,
              fill: "",
              originX: 'left',
              originY: 'top'
            },
            drawparams: function(pointer) {
              return {
                radius: Math.abs($scope.left - pointer.x)
              };
            }
          }, {
            name: 'rectangle',
            type: fabric.Rect,
            blank: {
              height: 1,
              width: 1,
              strokeWidth: 5,
              stroke: $scope.colorpicker.hex,
              selectable: false,
              fill: "",
              originX: 'left',
              originY: 'top'
            },
            drawparams: function(pointer) {
              return {
                width: -$scope.left + pointer.x,
                height: -$scope.top + pointer.y
              };
            }
          }
        ],
        events: {
          mouseup: function(e, canvas) {
            return $scope.mouseDown = false;
          },
          mousedown: function(e, canvas) {
            var pointer, shape, spec, type, we;
            $scope.mouseDown = true;
            pointer = canvas.getPointer(e.e);
            we = getSelf('shape');
            type = _.findWhere($scope.currentTool.types, {
              name: $scope.currentTool.type
            });
            spec = type.blank;
            spec.left = pointer.x;
            spec.top = pointer.y;
            shape = new type.type(spec);
            canvas.add(shape);
            return em.unit;
          },
          objectadded: null,
          mousemove: function(e, canvas) {
            var pointer, shape, type, we;
            if ($scope.mouseDown) {
              we = getSelf('shape');
              pointer = canvas.getPointer(e.e);
              shape = canvas.getObjects()[canvas.getObjects().length - 1];
              type = _.findWhere($scope.currentTool.types, {
                name: $scope.currentTool.type
              });
              shape.set(type.drawparams(pointer));
              canvas.renderAll();
            }
            return em.unit;
          }
        }
      }, {
        name: 'comment',
        properties: {
          isDrawingMode: false
        },
        annotating: true,
        events: {
          mouseup: null,
          mousedown: null,
          objectadded: null
        }
      }, {
        name: 'arrow',
        properties: {
          isDrawingMode: false
        },
        annotating: true
      }, {
        name: 'text',
        properties: {
          isDrawingMode: false
        },
        annotating: true
      }, {
        name: 'zoom',
        properties: {
          isDrawingMode: false
        },
        annotating: false,
        events: {
          mouseup: null,
          mousemove: function(o, canvas) {
            var SCALE_FACTOR, delta, klass, objects, pointer, transform, _i, _len;
            if ($scope.mouseDown) {
              SCALE_FACTOR = 0.01;
              pointer = canvas.getPointer(o.e);
              delta = $scope.left - pointer.x;
              objects = canvas.getObjects();
              delta = delta * SCALE_FACTOR;
              transform = [1 + delta, 0, 0, 1 + delta, 0, 0];
              console.log(transform);
              for (_i = 0, _len = objects.length; _i < _len; _i++) {
                klass = objects[_i];
                klass.transformMatrix = transform;
                klass.setCoords();
              }
              canvas.backgroundImage.transformMatrix = transform;
              canvas.setWidth(canvas.backgroundImage.width * canvas.backgroundImage.transformMatrix[0]);
              return canvas.setHeight(canvas.backgroundImage.height * canvas.backgroundImage.transformMatrix[3]);
            }
          },
          mousedown: function(o, canvas) {
            return $scope.left = canvas.getPointer(o.e).x;
          }
        }
      }, {
        name: 'colorpicker',
        properties: {},
        annotating: false
      }, {
        name: 'load',
        properties: {},
        annotating: false
      }, {
        name: 'export',
        properties: {},
        annotating: false
      }
    ];
    $scope.testSocket = function() {
      return em.unit;
    };
    $scope.loadImages = function() {
      var markers;
      markers = {
        "query": [
          {
            "field": "id",
            "operator": "matches",
            "values": ["*"]
          }
        ]
      };
      $.ajax({
        type: "POST",
        url: "/entermedia/services/json/search/data/asset?catalogid=media/catalogs/public",
        data: JSON.stringify(markers),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        async: false,
        success: function(data) {
          var tempArray;
          tempArray = [];
          $.each(data.results, function(index, obj) {
            var path;
            path = "http://localhost:8080/emshare/views/modules/asset/downloads/preview/thumbsmall/" + obj.sourcepath + "/thumb.jpg";
            console.log(path);
            console.log(fabric.util.loadImage(path, function(src) {
              return em.unit;
            }));
            return em.unit;
          });
          return em.unit;
        },
        failure: function(errMsg) {
          alert(errMsg);
          return em.unit;
        }
      });
      return em.unit;
    };
    $scope.selectTool = function(toolname) {
      var prop;
      if (!$scope.readyToComment) {
        $scope.currentTool = _.findWhere($scope.fabric.toolkit, {
          name: toolname
        });
        for (prop in $scope.currentTool.properties) {
          $scope.fabric.canvas[prop] = $scope.currentTool.properties[prop];
        }
        if ($scope.currentTool.name === 'draw') {
          $scope.fabric.canvas.freeDrawingBrush.color = $scope.colorpicker.hex;
          $scope.fabric.canvas.freeDrawingBrush.width = $scope.brushWidth;
        }
      }
      return em.unit;
    };
    $scope.setShapeTypeFromUi = function(type) {
      var prop;
      $scope.currentTool = _.findWhere($scope.fabric.toolkit, {
        name: 'shape'
      });
      $scope.currentTool.type = type;
      $scope.shapeToolType = $scope.currentTool.type;
      for (prop in $scope.currentTool.properties) {
        $scope.fabric.canvas[prop] = $scope.currentTool.properties[prop];
      }
      return em.unit;
    };
    usefulKeys = [''];
    $scope.currentAnnotation = _.find(annotationService.mockData, function(item) {
      return item.annotation.id === parseInt($stateParams.annotationID);
    });
    $scope.fabric = fabricJsService.init($scope.currentAnnotation.annotation.path);
    $scope.fabric.toolkit = toolkit;
    $scope.selectTool('draw');
    $scope.eventIndex = 0;
    $scope.annotationAction = null;
    $scope.currentAnnotationGroup = [];
    $scope.currentAnnotationGroupId = 0;

    /*
    	This whole process is muddled, what should happen is simple:
    	user clicks to draw a shape, that shape is added to the current group upon object:added
    	a timeout function begins to check if they are done annotating
    	if the user clicks again within a time window, the timeout function is cancelled
    	repeat process until...
    	user finishes annotation, they should be prompted for a comment
    	a pin should be created and added into the annotationGroup data
    	the pin should be rendered on screen somewhere appropriate and...
    	the comment should be added to scope with annotationGroup data to be attached to comment
     */
    $scope.setShapeType = function(type) {
      if (type === 'circle') {
        $scope.currentTool.type = fabric.Circle;
      } else if (type === 'rectangle') {
        $scope.currentTool.type = fabric.Rect;
      }
      return em.unit;
    };
    commentPin = function() {
      return new fabric.Group([
        new fabric.Circle({
          radius: 18.5,
          fill: "#fff"
        }), new fabric.Circle({
          radius: 14,
          fill: "#4fabe5",
          top: 5,
          left: 5
        }), new fabric.Text($scope.currentCommentIndex.toString(), {
          fontSize: 20,
          fill: "#fff",
          left: 13,
          top: 4
        })
      ], {
        evented: true,
        top: $scope.top - 15,
        left: $scope.left - 15,
        lockScalingX: false,
        lockScalingY: false,
        selectable: true
      });
    };
    readyToComment = function() {
      var pin;
      $scope.readyToComment = true;
      $scope.fabric.canvas.isDrawingMode = false;
      pin = commentPin();
      $scope.fabric.canvas.add(pin);
      $scope.currentAnnotationGroup.push(pin);
      $timeout((function() {
        $('#user-comment-input').focus();
        return em.unit;
      }), 100);
      $scope.selectTool('disabled');
      $('.upper-canvas').css({
        'background': 'rgba(255,255,255,0.7)'
      });
      return em.unit;
    };
    $scope.addComment = function() {
      var annotationSpec;
      annotationSpec = {
        id: $scope.currentCommentIndex++,
        group: $scope.currentAnnotationGroup,
        user: $scope.currentUser,
        comment: {
          type: 'normal',
          text: $scope.newCommentText,
          timestamp: moment().fromNow()
        }
      };
      $scope.annotations.unshift(annotationSpec);
      $scope.currentAnnotationGroup = [];
      $scope.newCommentText = null;
      $scope.readyToComment = false;
      $('.upper-canvas').css({
        'background': 'none'
      });
      $scope.left = null;
      $scope.top = null;
      annotationSocket.emit('newCommentAdded', annotationSpec);
      return em.unit;
    };
    $scope.removeComment = function(annotationid) {
      var currentAnnotation;
      currentAnnotation = _.findWhere($scope.annotations, {
        id: annotationid
      });
      _.forEach(currentAnnotation.group, function(item) {
        return $scope.fabric.canvas.remove(item);
      });
      $scope.annotations = _.without($scope.annotations, currentAnnotation);
      return em.unit;
    };
    $scope.cancelComment = function() {
      _.forEach($scope.currentAnnotationGroup, function(item) {
        return $scope.fabric.canvas.remove(item);
      });
      $scope.readyToComment = false;
      $('.upper-canvas').css({
        'background': 'none'
      });
      return em.unit;
    };
    $scope.$on('socket:newCommentAddedResponse', function(e, data) {
      console.log('data group: ', data.group);
      $scope.annotations.push(data);
      return em.unit;
    });
    $scope.fabric.canvas.on('mouse:down', function(e) {
      var pointer, _ref;
      console.log('click location: ', e.e);
      $scope.mouseDown = true;
      if ($scope.annotationAction !== null) {
        $timeout.cancel($scope.annotationAction);
      }
      pointer = $scope.fabric.canvas.getPointer(e.e);
      if ($scope.currentTool.name === 'comment') {
        $scope.left = pointer.x;
        $scope.top = pointer.y;
      }
      if (!$scope.readyToComment) {
        if ((_ref = $scope.currentTool.events) != null) {
          if (typeof _ref.mousedown === "function") {
            _ref.mousedown(e, $scope.fabric.canvas);
          }
        }
      }
      return em.unit;
    });
    $scope.fabric.canvas.on('mouse:up', function(e) {
      var _ref;
      $scope.mouseDown = false;
      if ($scope.currentTool.annotating) {
        if ($scope.currentTool.name === 'comment') {
          readyToComment();
        } else {
          $scope.annotationAction = $timeout(readyToComment, 1000);
        }
      }
      if ((_ref = $scope.currentTool.events) != null) {
        if (typeof _ref.mouseup === "function") {
          _ref.mouseup(e, $scope.fabric.canvas);
        }
      }
      return em.unit;
    });
    $scope.fabric.canvas.on('mouse:move', function(e) {
      var _ref;
      if ((_ref = $scope.currentTool.events) != null) {
        if (typeof _ref.mousemove === "function") {
          _ref.mousemove(e, $scope.fabric.canvas);
        }
      }
      return em.unit;
    });
    $scope.fabric.canvas.on('object:added', function(obj) {
      var _ref;
      if ($scope.currentTool.annotating) {
        obj.target.selectable = $scope.canSelect();
        $scope.currentAnnotationGroup.push(obj.target);
      }
      if ((_ref = $scope.currentTool.events) != null) {
        if (typeof _ref.objectadded === "function") {
          _ref.objectadded(obj, $scope.fabric.canvas);
        }
      }
      $scope.fabric.canvas.renderAll();
      $scope.fabric.canvas.calcOffset();
      if (!$scope.left) {
        $scope.left = obj.target.left;
      }
      if (!$scope.top) {
        $scope.top = obj.target.top;
      }
      return em.unit;
    });
    return em.unit;
  }
]);
