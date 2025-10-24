(function(w, $){
  'use strict';
  w.App = w.App || {};

  // Internal state
  var state = {
    step: 1,
    maxStep: 4,
    answers: {
      name: '', age: '', skinType: '', concerns: [], climate: 'temperate', sun: 'medium', lifestyle: [], prefs: [], actives: 'gentle'
    },
    result: null
  };

  function updateProgress(){
    var pct = Math.max(1, Math.round((state.step-0.2) / state.maxStep * 100));
    $('#progress').css('width', pct + '%');
  }

  function showStep(n){
    state.step = n;
    $('[data-step]').addClass('hidden');
    $('[data-step="' + n + '"]').removeClass('hidden');
    $('#pill-quiz').addClass('active');
    $('#pill-results').removeClass('active');
    $('#results').addClass('hidden');
    updateProgress();
    var $quiz = $('#quiz');
    var off = $quiz.length ? $quiz.offset() : null;
    if (off) { $('html, body').animate({ scrollTop: off.top - 60 }, 250); }
  }

  function validateStep(n){
    var ok = true;
    if (n === 1){
      var name = $('#name').val().trim();
      var age = $('#age').val();
      var skin = $('input[name="skinType"]:checked').val();
      $('#name-err, #age-err, #skin-err').addClass('hidden');
      if (!name || name.length > 30){ ok = false; $('#name-err').removeClass('hidden'); }
      if (!age){ ok = false; $('#age-err').removeClass('hidden'); }
      if (!skin){ ok = false; $('#skin-err').removeClass('hidden'); }
      if (ok){ state.answers.name = name; state.answers.age = age; state.answers.skinType = skin; }
    }
    if (n === 2){
      var concerns = [];
      $('[data-step="2"] input[type="checkbox"]:checked').each(function(){ concerns.push($(this).val()); });
      $('#concern-err').addClass('hidden');
      if (!concerns.length){ ok = false; $('#concern-err').removeClass('hidden'); }
      if (ok){ state.answers.concerns = concerns; }
    }
    if (n === 3){
      state.answers.climate = $('#climate').val();
      state.answers.sun = $('input[name="sun"]:checked').val();
      var lifestyle = [];
      $('[data-step="3"] input[type="checkbox"]:checked').each(function(){ lifestyle.push($(this).val()); });
      state.answers.lifestyle = lifestyle;
    }
    if (n === 4){
      var prefs = [];
      $('[data-step="4"] input[type="checkbox"]:checked').each(function(){ prefs.push($(this).val()); });
      state.answers.prefs = prefs;
      state.answers.actives = $('input[name="actives"]:checked').val();
    }
    return ok;
  }

  function computeAndRenderResults(){
    state.result = w.AppLogic.analyze(state.answers);
    renderResults(state.result);
    $('#pill-results').addClass('active');
    $('#pill-quiz').removeClass('active');
    $('#results').removeClass('hidden');
    var off = $('#results').offset(); if (off) { $('html, body').animate({ scrollTop: off.top - 60 }, 280); }
  }

  function renderResults(res){
    var title = (res.name ? res.name + "'s" : 'Your') + ' ' + res.title;
    $('#result-title').text(title);
    $('#result-sub').text('Skin type: ' + w.AppUtils.titleCase(res.meta.skinType || '-') + ' • Climate: ' + w.AppUtils.titleCase(res.meta.climate || '-') + ' • Sun: ' + (res.meta.sun || '-'));

    // Highlights
    var $hl = $('#result-highlights').empty();
    (res.meta.concerns || []).forEach(function(c){
      var label = c.replace('-', ' ');
      $hl.append($('<span class="chip"></span>').text('Focus: ' + w.AppUtils.titleCase(label)));
    });
    (res.meta.prefs || []).forEach(function(p){ $hl.append($('<span class="chip"></span>').text('Pref: ' + w.AppUtils.titleCase(p))); });

    // AM/PM
    var $am = $('#result-am').empty();
    res.routine.am.forEach(function(step){ $am.append($('<li></li>').text(step)); });
    var $pm = $('#result-pm').empty();
    res.routine.pm.forEach(function(step){ $pm.append($('<li></li>').text(step)); });

    // Ingredient insights
    var $ing = $('#result-ingredients').empty();
    res.ingredients.forEach(function(i){
      var card = $(
        '<div class="card ring-1 ring-neutral-200">' +
          '<div class="font-bold"></div>' +
          '<p class="text-sm text-neutral-700 mt-1"></p>' +
          (i.note ? '<p class="hint mt-1"></p>' : '') +
        '</div>'
      );
      card.find('.font-bold').text(i.name);
      card.find('.text-sm').text(i.why);
      if (i.note) card.find('.hint').text('Note: ' + i.note);
      $ing.append(card);
    });

    // Quotes
    var $q = $('#result-quotes').empty();
    res.quotes.forEach(function(q){
      var el = $(
        '<blockquote class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">' +
          '<p class="text-sm"></p>' +
          '<cite class="block mt-2 text-xs text-neutral-500 font-semibold"></cite>' +
        '</blockquote>'
      );
      el.find('p').text(q.text);
      el.find('cite').text(q.author);
      $q.append(el);
    });
  }

  function copyPlanToClipboard(){
    if (!state.result) return;
    var r = state.result;
    var text = '' + ((r.name || 'Your') + ' ' + r.title) + '\n' +
      'Skin type: ' + (r.meta.skinType || '-') + '\n' +
      'Concerns: ' + w.AppUtils.fmtList(r.meta.concerns) + '\n' +
      'Preferences: ' + w.AppUtils.fmtList(r.meta.prefs) + '\n\n' +
      'AM:\n - ' + r.routine.am.join('\n - ') + '\n\n' +
      'PM:\n - ' + r.routine.pm.join('\n - ') + '\n\n' +
      'Ingredients:\n - ' + r.ingredients.map(function(i){ return i.name + ' — ' + i.why; }).join('\n - ') + '\n';
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText){
      w.navigator.clipboard.writeText(text).then(function(){
        $('#btn-copy').text('Copied!');
        setTimeout(function(){ $('#btn-copy').text('Copy plan'); }, 1500);
      }).catch(function(){ alert('Copy failed. Please try again.'); });
    } else {
      // Fallback
      var ta = $('<textarea>').val(text).appendTo('body').select();
      try { document.execCommand('copy'); } catch(e){}
      ta.remove();
      $('#btn-copy').text('Copied!');
      setTimeout(function(){ $('#btn-copy').text('Copy plan'); }, 1500);
    }
  }

  function saveResult(){
    if (!state.result) return;
    var payload = { answers: state.answers, result: state.result };
    var ok = w.AppStorage.save(payload);
    if (ok){
      $('#btn-save').text('Saved');
      setTimeout(function(){ $('#btn-save').text('Save'); }, 1400);
    }
  }

  function printPlan(){
    window.print();
  }

  function bindEvents(){
    // Next/Prev
    $('[data-next]').on('click', function(){
      var s = state.step;
      if (!validateStep(s)) return;
      if (s < state.maxStep) showStep(s+1); else computeAndRenderResults();
    });
    $('[data-prev]').on('click', function(){ if (state.step > 1) showStep(state.step-1); });

    // Nav pills
    $('#pill-quiz').on('click', function(){ showStep(state.step); });
    $('#pill-results').on('click', function(){ if (state.result) { $('#results').removeClass('hidden'); $('#pill-results').addClass('active'); $('#pill-quiz').removeClass('active'); var off=$('#results').offset(); if(off){ $('html, body').animate({ scrollTop: off.top - 60 }, 220); } } });

    // Actions
    $('#btn-copy').on('click', copyPlanToClipboard);
    $('#btn-save').on('click', saveResult);
    $('#btn-print').on('click', printPlan);
    $('#btn-retake').on('click', function(){ state.step = 1; state.result = null; showStep(1); });

    // Saved result banner
    $('#btn-restore').on('click', function(){
      var saved = w.AppStorage.load();
      if (saved && saved.data && saved.data.result){
        state.answers = saved.data.answers || state.answers;
        state.result = saved.data.result;
        renderResults(state.result);
        $('#results').removeClass('hidden');
        $('#pill-results').addClass('active');
        $('#pill-quiz').removeClass('active');
        $('#notice-last').addClass('hidden');
      }
    });
    $('#btn-dismiss').on('click', function(){ $('#notice-last').addClass('hidden'); });
    $('#btn-view-last').on('click', function(){ $('#btn-restore').trigger('click'); });

    // Minor UX: Enter key on step 1 advances
    $('#name, #age').on('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); $('[data-step="1"] [data-next]').trigger('click'); } });
  }

  function showSavedBannerIfAny(){
    var saved = w.AppStorage.load();
    if (saved && saved.data && saved.data.result){
      var when = new Date(saved.savedAt || Date.now());
      $('#last-meta').text('Saved ' + when.toLocaleString());
      $('#notice-last').removeClass('hidden');
    }
  }

  // Public API per contract
  w.App.init = function(){
    $('#year-app').text(new Date().getFullYear());
    bindEvents();
    showSavedBannerIfAny();
  };

  w.App.render = function(){
    showStep(1);
  };

  // Expose for debug (optional)
  w.App._state = state;

})(window, jQuery);
