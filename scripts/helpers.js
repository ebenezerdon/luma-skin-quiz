(function(w){
  'use strict';
  w.App = w.App || {};

  // Simple storage helper with namespaced key
  w.AppStorage = {
    key: 'skincare.quiz.v1',
    save: function(data){
      try {
        localStorage.setItem(this.key, JSON.stringify({ savedAt: Date.now(), data: data }));
        return true;
      } catch(e){
        console.error('Storage save failed', e);
        return false;
      }
    },
    load: function(){
      try {
        var raw = localStorage.getItem(this.key);
        return raw ? JSON.parse(raw) : null;
      } catch(e){
        console.error('Storage load failed', e);
        return null;
      }
    },
    clear: function(){
      try { localStorage.removeItem(this.key); } catch(e){}
    }
  };

  // Utility methods
  w.AppUtils = {
    uid: function(){ return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36); },
    debounce: function(fn, delay){
      var t; return function(){
        var ctx = this, args = arguments; clearTimeout(t);
        t = setTimeout(function(){ fn.apply(ctx, args); }, delay);
      };
    },
    fmtList: function(arr){ return (arr || []).join(', '); },
    titleCase: function(str){ return String(str || '').replace(/\w\S*/g, function(t){ return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); }); }
  };

  // Domain logic to analyze answers and build a plan
  w.AppLogic = (function(){
    var ingredientMap = {
      acne: [
        { name: 'Salicylic acid', why: 'Unclogs pores and reduces breakouts', note: 'BHA 0.5-2%' },
        { name: 'Niacinamide', why: 'Balances oil and calms redness', note: '2-5%' }
      ],
      dryness: [
        { name: 'Hyaluronic acid', why: 'Multi-depth hydration and plumping', note: 'Mix sizes' },
        { name: 'Ceramides', why: 'Strengthens moisture barrier', note: 'AP, EOP, NP' }
      ],
      sensitivity: [
        { name: 'Centella asiatica', why: 'Soothes reactive skin', note: 'Cica' },
        { name: 'Allantoin', why: 'Reduces irritation', note: '' }
      ],
      hyperpigmentation: [
        { name: 'Vitamin C', why: 'Boosts radiance and evens tone', note: '10-15% ascorbyl' },
        { name: 'Azelaic acid', why: 'Targets dark spots while calming', note: '10%' }
      ],
      'fine-lines': [
        { name: 'Retinol', why: 'Supports collagen renewal', note: '0.2-0.3%' },
        { name: 'Peptides', why: 'Firms and smooths appearance', note: '' }
      ],
      dullness: [
        { name: 'Lactic acid', why: 'Gently resurfaces for glow', note: '5-10%' },
        { name: 'Vitamin C', why: 'Brightens complexion', note: '10-15%' }
      ],
      redness: [
        { name: 'Licorice root', why: 'Helps reduce visible redness', note: '' },
        { name: 'Green tea', why: 'Antioxidant and soothing', note: '' }
      ]
    };

    var quotes = {
      common: [
        { text: 'Consistency beats intensity. Start low and build slowly.', author: 'Dr. L. Moreno' },
        { text: 'Sunscreen each morning is the most reliable anti-aging step.', author: 'Dr. K. Shah' },
        { text: 'Patch test new products and introduce one change at a time.', author: 'Dr. A. Park' }
      ],
      acne: [
        { text: 'Keep pores clear with gentle exfoliation twice a week.', author: 'Dr. C. Patel' }
      ],
      dryness: [
        { text: 'Layer hydration: humectants, then emollients, then occlusives.', author: 'Dr. M. Nguyen' }
      ],
      sensitivity: [
        { text: 'Buffer stronger actives with moisturizer to reduce irritation.', author: 'Dr. I. Chen' }
      ],
      hyperpigmentation: [
        { text: 'Daily SPF protects gains from brightening ingredients.', author: 'Dr. P. Reyes' }
      ],
      'fine-lines': [
        { text: 'Retinoids work over months, not days. Be patient and gentle.', author: 'Dr. H. Evans' }
      ],
      dullness: [
        { text: 'Alternate exfoliation days with barrier-repair nights.', author: 'Dr. J. Ahmed' }
      ],
      redness: [
        { text: 'Avoid heat and heavy fragrance if you flush easily.', author: 'Dr. N. Lee' }
      ]
    };

    function pickQuotes(concerns){
      var pool = quotes.common.slice();
      (concerns || []).forEach(function(c){ if (quotes[c]) { Array.prototype.push.apply(pool, quotes[c]); } });
      // pick up to 2 distinct quotes
      var unique = [];
      while (pool.length && unique.length < 2){
        var idx = Math.floor(Math.random() * pool.length);
        unique.push(pool.splice(idx,1)[0]);
      }
      return unique;
    }

    function uniqueIngredients(concerns){
      var list = [];
      (concerns || []).forEach(function(c){
        (ingredientMap[c] || []).forEach(function(i){
          if (!list.some(function(x){ return x.name === i.name; })) list.push(i);
        });
      });
      return list.slice(0, 6);
    }

    function moisturizerByType(type, climate){
      var base;
      if (type === 'oily') base = 'Light gel moisturizer';
      else if (type === 'dry') base = 'Rich ceramide cream';
      else if (type === 'combination') base = 'Balanced lotion moisturizer';
      else base = 'Everyday lotion moisturizer';
      if (climate === 'dry' || climate === 'cold') base += ' with ceramides';
      if (climate === 'humid' || climate === 'hot') base = base.replace('Rich ', '').replace('ceramide ','');
      return base;
    }

    function buildRoutine(answers){
      var t = answers.skinType;
      var c = answers.concerns || [];
      var climate = answers.climate || 'temperate';
      var sun = answers.sun || 'medium';
      var actives = answers.actives || 'gentle';
      var prefs = answers.prefs || [];
      var gentle = actives === 'gentle';
      var sensitive = c.indexOf('sensitivity') >= 0;

      var am = [];
      am.push(t === 'oily' ? 'Gel cleanser' : 'Gentle cleanser');
      if (c.indexOf('hyperpigmentation') >= 0 || c.indexOf('dullness') >= 0) {
        am.push('Vitamin C serum ' + (gentle ? '10%' : '15%'));
      }
      if (c.indexOf('redness') >= 0) am.push('Niacinamide 4-5%');
      am.push(moisturizerByType(t, climate));
      am.push('Broad-spectrum sunscreen ' + (sun === 'high' ? 'SPF 50+' : 'SPF 30+'));

      var pm = [];
      pm.push(t === 'dry' ? 'Cream cleanser' : 'Gentle cleanser');
      if (!sensitive && (c.indexOf('fine-lines') >= 0 || c.indexOf('acne') >= 0)) {
        pm.push('Retinol ' + (gentle ? '0.2%' : actives === 'advanced' ? '0.5%' : '0.3%') + ' (2-3x/week)');
      } else if (c.indexOf('acne') >= 0) {
        pm.push('Azelaic acid 10%');
      }
      if (c.indexOf('acne') >= 0) pm.push('Salicylic acid 0.5-2% (1-3x/week)');
      pm.push(moisturizerByType(t, climate));

      if (prefs.indexOf('fragrance-free') >= 0) {
        am = am.map(function(s){ return s + ' (fragrance-free)'; });
        pm = pm.map(function(s){ return s + ' (fragrance-free)'; });
      }

      if (answers.lifestyle && answers.lifestyle.indexOf('minimal') >= 0) {
        // reduce steps: keep cleanser, one active, moisturizer, SPF AM
        am = [ am[0], am[1] || 'Niacinamide 4-5%', am[am.length-2], am[am.length-1] ];
        pm = [ pm[0], pm[1] || 'Peptides serum', pm[pm.length-1] ];
      }

      return { am: am, pm: pm };
    }

    function buildTitle(answers){
      var c = answers.concerns || [];
      var parts = [];
      if (answers.skinType) parts.push(w.AppUtils.titleCase(answers.skinType));
      if (c.indexOf('hyperpigmentation')>=0 || c.indexOf('dullness')>=0) parts.push('Brightening');
      if (c.indexOf('acne')>=0) parts.push('Clarifying');
      if (c.indexOf('dryness')>=0) parts.push('Hydrating');
      if (c.indexOf('fine-lines')>=0) parts.push('Smoothing');
      if (c.indexOf('redness')>=0 || c.indexOf('sensitivity')>=0) parts.push('Calming');
      return parts.length ? parts.join(' + ') : 'Personalized Plan';
    }

    function analyze(answers){
      var ingredients = uniqueIngredients(answers.concerns);
      var routine = buildRoutine(answers);
      var qs = pickQuotes(answers.concerns);
      var title = buildTitle(answers);
      return {
        title: title,
        name: answers.name || 'Your',
        ingredients: ingredients,
        routine: routine,
        quotes: qs,
        meta: {
          skinType: answers.skinType,
          age: answers.age,
          climate: answers.climate,
          sun: answers.sun,
          prefs: answers.prefs || [],
          concerns: answers.concerns || []
        }
      };
    }

    return { analyze: analyze };
  })();
})(window);
