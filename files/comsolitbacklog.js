(function(){
  var
    cssClassDragOver = 'comsolitbldragover',
    cssClassDragged = 'comsolitbldragged',
    comsolitBacklog = angular.module('comsolitBacklog', ['ng']),
    moveItem // function defined in comsolitBacklogCtrl
    ;

  function getEmbeddedJSON(name) {
    var context = arguments.length === 2 ? arguments[1] : 'body';

    var node = document.querySelector(context + ' script.embedded-json-data[data-name="' + name + '"]');
    var unparsed = node.innerHTML;
    return JSON.parse(unparsed);
  }

  comsolitBacklog.controller('comsolitBacklogCtrl', function($scope){
    $scope.items = getEmbeddedJSON('backlogItems');

    moveItem = (function(){

      var minPos = -1, maxPos = -1, itemsById = {};

      for(var i=0; i < $scope.items.length; ++i) {
        var item = $scope.items[i];
        item.backlog_position = parseFloat(item.backlog_position);
        if(!minPos === -1 || (item.backlog_position && item.backlog_position < minPos)) minPos = item.backlog_position;
        if(!maxPos === -1 || (item.backlog_position && item.backlog_position > maxPos)) maxPos = item.backlog_position;
        itemsById[item.id] = item;
      }

      function searchNextPosition(pos) {
        var nextPos = maxPos;

        for(var i = 0; i < $scope.items.length; ++i) {
          var itemPos = $scope.items[i].backlog_position;
          if(itemPos < maxPos && itemPos > pos) nextPos = itemPos;
        }

        return nextPos;
      }

      function updateMinMax(oldPos, newPos) {
        minPos = -1;
        maxPos = -1;
        for(var i = 0; i < $scope.items.length; ++i) {
          if(minPos === -1 || (item.backlog_position && item.backlog_position < minPos)) minPos = item.backlog_position;
          if(maxPos === -1 || (item.backlog_position && item.backlog_position > maxPos)) maxPos = item.backlog_position;
        }
        return newPos;
      }

      function calcNewPos(dropPos, oldPos) {
        var newPos;

        if(!dropPos) { // item dragged on the first line
          if(oldPos && oldPos === minPos) return -1; // item was already the first
          return updateMinMax(oldPos, minPos > 0 ? minPos / 2 : Math.pow(2,64));
        }

        if(dropPos === maxPos) {  // item dropped on the last item
          return updateMinMax(oldPos, maxPos * 2);
        }

        var nextPosition = searchNextPosition(dropPos);
        if(nextPosition === oldPos) return -1; // item dropped on the item before itself
        return (dropPos + nextPosition) / 2;
      }

      return function(dragId, dropId){
        var
          dragItem = itemsById[dragId],
          oldPos = dragItem.backlog_position,
          dropItem = dropId && itemsById[dropId],
          dropPos = dropItem && dropItem.backlog_position;

        if(dragId === dropId) return; // item dropped on itself

        var newPos = calcNewPos(dropPos, oldPos);
        console.log(newPos);
        if(newPos < 0) return;
        dragItem.backlog_position = newPos;
        $scope.$apply();
      };
    })();

  });

  comsolitBacklog.filter('prioritizedItems', function(){
    var filters = {
      'false': function(x){return 0.0 === parseFloat(x.backlog_position)},
      'true': function(x){return parseFloat(x.backlog_position) > 0}
    };
    return function(items, prioritized){
      var filter = filters[prioritized];
      return items.filter(filter, items);
    };
  });

  comsolitBacklog.directive('comsolitbldraggable', function() {
    return function(scope, element) {

      element.on('dragstart', function(e){
        var target = angular.element(e.target);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('Text', target.attr('data-id'));
        e.dataTransfer.setDragImage(e.target, 0, 0);
        target.addClass(cssClassDragged);
      });

      element.on('dragend', function(e){
        var target = angular.element(e.target);
        target.removeClass(cssClassDragged);
      });

    }
  });

  comsolitBacklog.directive('comsolitbldroppable', function() {
    return function(scope, element) {

      element.on('dragenter', function(e){
        var target = angular.element(this);
        target.addClass(cssClassDragOver);
      });

      element.on('dragleave', function(e){
        var target = angular.element(this);
        target.removeClass(cssClassDragOver);
      });

      element.on('dragover', function(e){
        e.preventDefault();
        return false;
      });

      element.on('drop', function(e){
        var
          target = angular.element(this),
          dragId = e.dataTransfer.getData('Text'),
          dropId = target.attr('data-id')
        ;

        target.removeClass(cssClassDragOver);

        moveItem(dragId, dropId);
      });
    }
  });
})();