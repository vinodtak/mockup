/* Related items pattern.
 *
 * Options:
 *    vocabularyUrl(string): This is a URL to a JSON-formatted file used to populate the list (null)
 *    attributes(array): This list is passed to the server during an AJAX request to specify the attributes which should be included on each item. (['UID', 'Title', 'Type', 'path'])
 *    basePath(string): If this is set the widget will start in "Browse" mode and will pass the path to the server to filter the results. ('/')
 *    breadCrumbTemplate(string): Template to use for a single item in the breadcrumbs. ('/<a href="<%= path %>"><%= text %></a>')
 *    breadCrumbTemplateSelector(string): Select an element from the DOM from which to grab the breadCrumbTemplate. (null)
 *    breadCrumbsTemplate(string): Template for element to which breadCrumbs will be appended. ('<span><span class="pattern-relateditems-path-label"><%= searchText %></span><a class="icon-home" href="/"></a><%= items %></span>')
 *    breadCrumbsTemplateSelector(string): Select an element from the DOM from which to grab the breadCrumbsTemplate. (null)
 *    cache(boolean): Whether or not results from the server should be
 *    cached. (true)
 *    closeOnSelect(boolean): Select2 option. Whether or not the drop down should be closed when an item is selected. (false)
 *    dropdownCssClass(string): Select2 option. CSS class to add to the drop down element. ('pattern-relateditems-dropdown')
 *    folderTypes(array): Types which should be considered browsable. (["Folder"])
 *    homeText(string): Text to display in the initial breadcrumb item. (home)
 *    maximumSelectionSize(integer): The maximum number of items that can be selected in a multi-select control. If this number is less than 1 selection is not limited. (-1)
 *    multiple(boolean): Do not change this option. (true)
 *    orderable(boolean): Whether or not items should be drag-and-drop sortable. (true)
 *    resultTemplate(string): Template for an item in the in the list of results. Refer to source for default. (Refer to source)
 *    resultTemplateSelector(string): Select an element from the DOM from which to grab the resultTemplate. (null)
 *    searchText(string): Text which will be inserted to the left of the
 *    path. (Search)
 *    searchAllText(string): Displays next to the path when the path is set to the root. (All)
 *    selectableTypes(array): If the value is null all types are selectable. Otherwise, provide a list of strings to match item types that are selectable. (null)
 *    selectionTemplate(string): Template for element that will be used to construct a selected item. (Refer to source)
 *    selectionTemplateSelector(string): Select an element from the DOM from which to grab the selectionTemplate. (null)
 *    separator(string): Select2 option. String which separates multiple items. (',')
 *    tokenSeparators(array): Select2 option, refer to select2 documentation.
 *    ([",", " "])
 *    width(string): Specify a width for the widget. ('300px')
 *
 * Documentation:
 *    The Related Items pattern is based on Select2 so many of the same options will work here as well.
 *
 *    # Default
 *
 *    {{ example-1 }}
 *
 *    # Existing values, some bad
 *
 *    {{ example-2 }}
 *
 *    # Selectable Types
 *
 *    {{ example-3 }}
 *
 *    # Select a single item
 *
 *    {{ example-4 }}
 *
 * Example: example-1
 *    <input type="text" class="pat-relateditems"
 *           data-pat-relateditems="width:30em;
 *                                  vocabularyUrl:/relateditems-test.json" />
 *
 * Example: example-2
 *    <input type="text" class="pat-relateditems"
 *           value="asdf1234gsad,sdfbsfdh345,asdlfkjasdlfkjasdf,kokpoius98"
 *           data-pat-relateditems="width:30em; vocabularyUrl:/relateditems-test.json" />
 *
 * Example: example-3
 *    <input type="text" class="pat-relateditems"
             data-pat-relateditems='{"selectableTypes": ["Document"], "vocabularyUrl": "/relateditems-test.json"}' />
 *
 * Example: example-4
 *    <input type="text" class="pat-relateditems"
             data-pat-relateditems='{"selectableTypes": ["Document"], "vocabularyUrl": "/relateditems-test.json", "maximumSelectionSize": 1}' />
 *
 */


define([
  'jquery',
  'underscore',
  'mockup-patterns-base',
  'mockup-patterns-select2',
  'mockup-utils',
  'mockup-patterns-tree',
  'mockup-i18n'
], function($, _, Base, Select2, utils, Tree, i18n) {
  'use strict';

  i18n.loadCatalog('widgets');
  var _t = i18n.MessageFactory('widgets');

  var RelatedItems = Base.extend({
    name: 'relateditems',
    browsing: false,
    currentPath: null,
    defaults: {
      vocabularyUrl: null, // must be set to work
      width: '300px',
      multiple: true,
      tokenSeparators: [',', ' '],
      separator: ',',
      orderable: true,
      cache: true,
      mode: 'search', // possible values are search and browse
      closeOnSelect: false,
      basePath: '/',
      searchText: _t('Search:'),
      searchAllText: _t('entire site'),
      homeText: _t('home'),
      folderTypes: ['Folder'],
      selectableTypes: null, // null means everything is selectable, otherwise a list of strings to match types that are selectable
      attributes: ['UID', 'Title', 'Type', 'path'],
      dropdownCssClass: 'pattern-relateditems-dropdown',
      maximumSelectionSize: -1,
      resultTemplate: '' +
        '<div class="pattern-relateditems-result pattern-relateditems-type-<%= Type %> <% if (selected) { %>pattern-relateditems-active<% } %>">' +
        '  <a href="#" class="pattern-relateditems-result-select <% if (selectable) { %>selectable<% } %>">' +
        '    <span class="pattern-relateditems-result-title"><%= Title %></span>' +
        '    <span class="pattern-relateditems-result-path"><%= path %></span>' +
        '  </a>' +
        '  <span class="pattern-relateditems-buttons">' +
        '  <% if (folderish) { %>' +
        '     <a class="pattern-relateditems-result-browse" href="#" data-path="<%= path %>"></a>' +
        '   <% } %>' +
        ' </span>' +
        '</div>',
      resultTemplateSelector: null,
      selectionTemplate: '' +
        '<span class="pattern-relateditems-item pattern-relateditems-type-<%= Type %>">' +
        ' <span class="pattern-relateditems-item-title"><%= Title %></span>' +
        ' <span class="pattern-relateditems-item-path"><%= path %></span>' +
        '</span>',
      selectionTemplateSelector: null,
      breadCrumbsTemplate: '<span>' +
        '<span class="pattern-relateditems-tree">' +
          '<a href="#" class="pattern-relateditems-tree-select"><span class="glyphicon glyphicon-indent-left"></span></a> ' +
          '<div class="tree-container">' +
            '<span class="select-folder-label">Select folder</span>' +
            '<a href="#" class="btn close pattern-relateditems-tree-cancel">X</a>' +
            '<div class="pat-tree" />' +
            '<a href="#" class="btn btn-default pattern-relateditems-tree-itemselect">Select</a>' +
          '</div>' +
        '</span>' +
        '<span class="pattern-relateditems-path-label">' +
          '<%= searchText %></span><a class="crumb" href="/"><span class="glyphicon glyphicon-home"></span></a><%= items %>' +
        '</span>' +
      '</span>',
      breadCrumbsTemplateSelector: null,
      breadCrumbTemplate: '' +
        '/<a href="<%= path %>" class="crumb"><%= text %></a>',
      breadCrumbTemplateSelector: null,
      escapeMarkup: function(text) {
        return text;
      },
      setupAjax: function() {
        // Setup the ajax object to use during requests
        var self = this;
        if (self.query.valid) {
          return self.query.selectAjax();
        }
        return {};
      }
    },
    applyTemplate: function(tpl, item) {
      var self = this;
      var template;
      if (self.options[tpl + 'TemplateSelector']) {
        template = $(self.options[tpl + 'TemplateSelector']).html();
        if (!template) {
          template = self.options[tpl + 'Template'];
        }
      } else {
        template = self.options[tpl + 'Template'];
      }
      // let's give all the options possible to the template generation
      var options = $.extend(true, {}, self.options, item);
      options._item = item;
      return _.template(template, options);
    },
    activateBrowsing: function() {
      var self = this;
      self.browsing = true;
      self.setBreadCrumbs();
    },
    deactivateBrowsing: function() {
      var self = this;
      self.browsing = false;
      self.setBreadCrumbs();
    },
    browseTo: function(path) {
      var self = this;
      self.trigger('before-browse');
      self.currentPath = path;
      if (path === '/' && self.options.mode === 'search') {
        self.deactivateBrowsing();
      } else {
        self.activateBrowsing();
      }
      self.$el.select2('close');
      self.$el.select2('open');
      self.trigger('after-browse');
    },
    setBreadCrumbs: function() {
      var self = this;
      var path = self.currentPath ? self.currentPath : self.options.basePath;
      var html;
      if (path === '/') {
        var searchText = '';
        if (self.options.mode === 'search') {
          searchText = '<em>' + self.options.searchAllText + '</em>';
        }
        html = self.applyTemplate('breadCrumbs', {
          items: searchText,
          searchText: self.options.searchText
        });
      } else {
        var paths = path.split('/');
        var itemPath = '';
        var itemsHtml = '';
        _.each(paths, function(node) {
          if (node !== '') {
            var item = {};
            itemPath = itemPath + '/' + node;
            item.text = node;
            item.path = itemPath;
            itemsHtml = itemsHtml + self.applyTemplate('breadCrumb', item);
          }
        });
        html = self.applyTemplate('breadCrumbs', {items: itemsHtml, searchText: self.options.searchText});
      }
      var $crumbs = $(html);
      $('a.crumb', $crumbs).on('click', function(e) {
        e.preventDefault();
        self.browseTo($(this).attr('href'));
        return false;
      });
      var $treeSelect = $('.pattern-relateditems-tree-select', $crumbs);
      var $container = $treeSelect.parent();
      var $treeContainer = $('.tree-container', $container);
      var $tree = $('.pat-tree', $container);
      var selectedNode = null;
      var treePattern = new Tree($tree, {
        data: [],
        dataFilter: function(data) {
          var nodes = [];
          _.each(data.results, function(item) {
            nodes.push({
              label: item.Title,
              id: item.UID,
              path: item.path
            });
          });
          return nodes;
        }
      });
      treePattern.$el.bind('tree.select', function(e) {
        var node = e.node;
        if (node && !node._loaded) {
          self.currentPath = node.path;
          selectedNode = node;
          treePattern.$el.tree('loadDataFromUrl', self.treeQuery.getUrl(), node);
          node._loaded = true;
        }
      });
      treePattern.$el.bind('tree.refresh', function() {
        /* the purpose of this is that when new data is loaded, the selected
         * node is cleared. This re-selects it as a user browses structure of site */
        if (selectedNode) {
          treePattern.$el.tree('selectNode', selectedNode);
        }
      });
      $('a.pattern-relateditems-tree-cancel', $treeContainer).click(function(e) {
        e.preventDefault();
        $treeContainer.fadeOut();
        return false;
      });

      $('a.pattern-relateditems-tree-itemselect', $treeContainer).click(function(e) {
        e.preventDefault();
        self.browseTo(self.currentPath); // just browse to current path since it's set elsewhere
        $treeContainer.fadeOut();
        return false;
      });

      $treeSelect.on('click', function(e) {
        e.preventDefault();
        self.browsing = true;
        self.currentPath = '/';
        $treeContainer.fadeIn();
        treePattern.$el.tree('loadDataFromUrl', self.treeQuery.getUrl());
        return false;
      });
      self.$browsePath.html($crumbs);
    },
    selectItem: function(item) {
      var self = this;
      self.trigger('selecting');
      var data = self.$el.select2('data');
      data.push(item);
      self.$el.select2('data', data);
      item.selected = true;
      self.trigger('selected');
    },
    deselectItem: function(item) {
      var self = this;
      self.trigger('deselecting');
      var data = self.$el.select2('data');
      _.each(data, function(obj, i) {
        if (obj.UID === item.UID) {
          data.splice(i, 1);
        }
      });
      self.$el.select2('data', data);
      item.selected = false;
      self.trigger('deselected');
    },
    isSelectable: function(item) {
      var self = this;
      if (self.options.selectableTypes === null) {
        return true;
      } else {
        return _.indexOf(self.options.selectableTypes, item.Type) > -1;
      }
    },
    init: function() {
      var self = this;

      self.query = new utils.QueryHelper(
        $.extend(true, {}, self.options, {pattern: self})
      );
      self.treeQuery = new utils.QueryHelper(
        $.extend(true, {}, self.options, {
          pattern: self,
          baseCriteria: [{
            i: 'Type',
            o: 'plone.app.querystring.operation.list.contains',
            v: self.options.folderTypes
          }]
        })
      );

      self.options.ajax = self.options.setupAjax.apply(self);

      self.$el.wrap('<div class="pattern-relateditems-container" />');
      self.$container = self.$el.parents('.pattern-relateditems-container');
      self.$container.width(self.options.width);

      Select2.prototype.initializeValues.call(self);
      Select2.prototype.initializeTags.call(self);

      self.options.formatSelection = function(item, $container) {
        return self.applyTemplate('selection', item);
      };

      Select2.prototype.initializeOrdering.call(self);

      self.options.formatResult = function(item) {
        if (!item.Type || _.indexOf(self.options.folderTypes, item.Type) === -1) {
          item.folderish = false;
        } else {
          item.folderish = true;
        }

        item.selectable = self.isSelectable(item);

        if (item.selected === undefined) {
          var data = self.$el.select2('data');
          item.selected = false;
          _.each(data, function(obj) {
            if (obj.UID === item.UID) {
              item.selected = true;
            }
          });
        }

        var result = $(self.applyTemplate('result', item));

        $('.pattern-relateditems-result-select', result).on('click', function(event) {
          event.preventDefault();
          if ($(this).is('.selectable')) {
            var $parent = $(this).parents('.pattern-relateditems-result');
            if ($parent.is('.pattern-relateditems-active')) {
              $parent.removeClass('pattern-relateditems-active');
              self.deselectItem(item);
            } else {
              self.selectItem(item);
              $parent.addClass('pattern-relateditems-active');
              if (self.options.maximumSelectionSize > 0) {
                var items = self.$select2.select2('data');
                if (items.length >= self.options.maximumSelectionSize) {
                  self.$select2.select2('close');
                }
              }
            }
          }
        });

        $('.pattern-relateditems-result-browse', result).on('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          var path = $(this).data('path');
          self.browseTo(path);
        });

        return $(result);
      };
      self.options.initSelection = function(element, callback) {
        var data = [];
        var value = $(element).val();
        if (value !== '') {
          var ids = value.split(self.options.separator);
          self.query.search(
            'UID', 'plone.app.querystring.operation.list.contains', ids,
            function(data) {
              var results = data.results.reduce(function(prev, item) {
                prev[item.UID] = item;
                return prev;
              }, {});
              callback(
                ids
                  .map(function(uid) { return results[uid]; })
                  .filter(function(item) { return item !== undefined; })
              );
            },
            false
          );
        }
      };

      self.options.id = function(item) {
        return item.UID;
      };

      Select2.prototype.initializeSelect2.call(self);

      // Browsing functionality
      var browseOpts = {
        browseText: self.options.browseText,
        searchText: self.options.searchText
      };

      self.$browsePath = $('<span class="pattern-relateditems-path" />');
      self.$container.prepend(self.$browsePath);

      if (self.options.mode === 'search') {
        self.deactivateBrowsing();
        self.browsing = false;
      } else {
        self.activateBrowsing();
        self.browsing = true;
      }

      self.$el.on('select2-selecting', function(event) {
        event.preventDefault();
      });

    }
  });

  return RelatedItems;

});
