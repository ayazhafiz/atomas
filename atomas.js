(() => {
  const PROBABILITY = { plus: 0.3 };
  PROBABILITY.minus = PROBABILITY.plus + 0.07;
  PROBABILITY.neutrino = PROBABILITY.minus + 0.0166;
  PROBABILITY.dark = PROBABILITY.neutrino + 0.012;

  window.offsetAngle = 0;
  window.carousel = $('#carousel');
  window.container = $('.container');
  window.carouselBoundingRect = window.carousel[0].getBoundingClientRect();
  window.carouselSize;
  window.generator;
  window.score = $('.window.score');
  window.vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  window.preventClick = false;
  window.preventIntermediateClick = false;
  window.allowForConversionToPlus = false;

  class Atom {
    constructor(num, modifier = false, cl = 'circle') {
      let _elements = modifier ? Atom.modifiers : Atom.elements;

      this.Z = _elements[num].Z;
      this.X = _elements[num].X;
      this.name = _elements[num].name;
      this.color = `#${_elements[num].color}`;

      this.el = $(`<div class=${cl}></div>`);
      this.show();
      this.triggerModifierClasses();
    }
    update(num) {
      this.Z = Atom.elements[num].Z;
      this.X = Atom.elements[num].X;
      this.name = Atom.elements[num].name;
      this.color = '#' + Atom.elements[num].color;

      this.show();
      this.triggerModifierClasses();
    }
    show() {
      this.el.html(`${this.X}<div>${this.Z > 0 ? this.Z : ' '}</div>`);
      this.el.css('background', this.color);
    }
    triggerModifierClasses() {
      if (
        this.Z == -1 ||
        this.Z == -4 // plus, dark plus
      )
        this.el.addClass('pulse-outer');
      else if (this.Z == -2 || this.Z == -3) {
        // minus, neutrino
        this.el.addClass('pulse-inner');
        pIntermediateClick();
      } else this.el.removeClass('pulse-outer pulse-inner');
    }
  }
  Atom.atoms = [];
  Atom.elements = {};
  Atom.setElements = function(elements) {
    Atom.elements = elements;
    Object.freeze(Atom.elements, Atom.modifiers);
  };
  Atom.modifiers = [
    { Z: -4, X: ' ', name: 'Dark Plus', color: '000000' },
    { Z: -3, X: ' ', name: 'Neutrino', color: 'F8F8FF' },
    { Z: -2, X: '-', name: 'Minus', color: '4576BA' },
    { Z: -1, X: '+', name: 'Plus', color: 'C24342' }
  ];

  class Generator extends Atom {
    constructor(num) {
      super(num, false, 'circle-centered');
    }
    createNewValue(preset = false) {
      let _elements = Atom.modifiers,
        rv = Math.random(),
        l;

      // cascade through probabilities
      if (rv <= PROBABILITY.plus) {
        l = 3;
      } else if (rv <= PROBABILITY.minus) {
        l = 2;
      } else if (rv <= PROBABILITY.neutrino) {
        l = 1;
      } else if (rv <= PROBABILITY.dark.plus) {
        l = 0;
      } else {
        _elements = Atom.elements;
        let s = 0,
          length = 0;

        // generate random atom within 3 of current average
        for (let atom of Atom.atoms)
          if (atom.Z > 0) {
            s += atom.Z;
            length++;
          }
        s /= length;

        l = Math.floor(Math.random() * 6 + s - 3);
        if (l < 0) l = 0;
      }

      if (preset !== false) {
        l = preset;
        _elements = Atom.elements;
        if (l < 0) {
          l = 3;
          _elements = Atom.modifiers;
        }
      }

      return [_elements, l];
    }
    update(preset = false) {
      let [_elements, l] = this.createNewValue(preset);

      this.Z = _elements[l].Z;
      this.X = _elements[l].X;
      this.name = _elements[l].name;
      this.color = '#' + _elements[l].color;

      this.show();
      this.triggerModifierClasses();
      this.updateBg();

      pConversionToPlus();
    }
    updateBg() {
      $('body').css(
        'background',
        `radial-gradient(circle, ${hexToRgba(
          this.color,
          0.2
        )}, rgba(219, 112, 147, 0.25))`
      );
    }
  }

  function init() {
    for (let i = 0; i < 3; i++)
      Atom.atoms.push(new Atom(Math.floor(Math.random() * 3)));
    window.generator = new Generator(Math.floor(Math.random() * 3));

    for (let atom of Atom.atoms) window.container.append(atom.el);
    window.container.append(window.generator.el);

    window.window.carouselSize = {
      w: window.window.carouselBoundingRect.width,
      h: window.window.carouselBoundingRect.height,
      radius: window.window.carouselBoundingRect.width / 2,
      circle: Atom.atoms[0].el[0].getBoundingClientRect().width
    };
    setPosition();
  }

  function setPosition() {
    // this normalizes the transition or something? idk
    Atom.atoms[0].el[0].getBoundingClientRect().width;

    for (var i = 0; i < Atom.atoms.length; i++) {
      let angle = 360 / Atom.atoms.length * (i + 1) + window.offsetAngle,
        transformY =
          Math.sin(Math.radians(angle)) *
            (window.window.carouselSize.radius - 7.14286 * window.vmin) -
          window.window.carouselSize.circle / 2 +
          'px',
        transformX =
          Math.cos(Math.radians(angle)) *
            (window.window.carouselSize.radius - 7.14286 * window.vmin) -
          window.window.carouselSize.circle / 2 +
          'px';

      Atom.atoms[
        i
      ].el[0].style.transform = `translate(${transformX}, ${transformY})`;
      Atom.atoms[i].el[0].style.transition =
        'all 0.5s cubic-bezier(0.10, -0.50, 0.7, 1.50)';
      Atom.atoms[i].el[0].style.opacity = 1;
    }
  }

  function addAtom(atomBefore) {
    pClick();

    let _atom =
      window.generator.Z < 0
        ? new Atom(4 + window.generator.Z, true)
        : new Atom(window.generator.Z - 1);
    _atom.el.insertAfter(atomBefore.el);
    Atom.atoms.splice(Atom.atoms.indexOf(atomBefore) + 1, 0, _atom);

    window.generator.update();
    setPosition();

    doTheFusionDance(_atom);
  }

  function checkForFusions(
    _atom,
    isDarkPlus = false,
    flag = false,
    amt = false
  ) {
    let plusI = Atom.atoms.indexOf(_atom),
      [index1, index2] = getAdjacentAtoms(plusI);

    if (isEdgeCase(_atom, index1, index2, isDarkPlus)) {
      aClick();
      return checkDots();
    }

    // we can just do the dance in this function instead of killing ourselves with 40 callbacks
    setTimeout(() => {
      let adder =
        amt ||
        (isDarkPlus
          ? Math.max(Atom.atoms[index1].Z, Atom.atoms[index2].Z) + 1 // if it's dark plus, we go up by two initially
          : Atom.atoms[index1].Z - 1); // if not, we take the place of either existing atom

      while (isFuseable(index1, index2, isDarkPlus)) {
        increaseUserScore(index1, index2);

        if (!flag) {
          setTimeout(() => {
            transitionUpperIndexAtoms(plusI, index1, index2);
            checkForFusions(_atom, isDarkPlus, true, adder);
          }, 300); // give a smooth delay
          return;
        }

        // bump up counter
        if (Atom.atoms[index1].Z < 0 || Atom.atoms[index2].Z < 0)
          adder = Math.max(
            0,
            Math.max(Atom.atoms[index1].Z, Atom.atoms[index2].Z)
          );

        adder = Math.max(adder + 1, Atom.atoms[index1].Z);

        // remove old Atom.atoms
        Atom.atoms[index1].el.remove();
        Atom.atoms[index2].el.remove();
        if (index1 < index2) {
          Atom.atoms.splice(index2, 1);
          Atom.atoms.splice(index1, 1);
        } else {
          Atom.atoms.splice(index1, 1);
          Atom.atoms.splice(index2, 1);
        }

        // find new indeces
        plusI = Atom.atoms.indexOf(_atom);
        index1 = plusI - 1;
        if (index1 < 0) index1 = Atom.atoms.length - 1;
        index2 = plusI + 1;
        if (index2 >= Atom.atoms.length) index2 = 0;

        // force-fusion is done
        isDarkPlus = false;

        // no transition
        flag = false;
      }

      _atom.update(adder);

      setPosition();

      checkForFusionTriggers();
    }, 300); // give a smooth delay
  }

  function renderIntermediateClick(e) {
    if (Atom.atoms.length < 2) {
      // if atom has no neighbors, we'll just push it in no worries
      let _atom =
        window.generator.Z < 0
          ? new Atom(4 + window.generator.Z, true)
          : new Atom(window.generator.Z - 1);

      window.container.prepend(_atom.el);
      Atom.atoms.splice(0, 0, _atom);
      return setPosition();
    }

    // find where atom belongs in the area we clicked
    let _x = e.clientX,
      _y = e.clientY,
      atom1 = Atom.atoms[Atom.atoms.length - 1],
      atom2 = Atom.atoms[0],
      shortestPath = getDistance(atom1.el, atom2.el, _x, _y); // first check edge case

    for (let i = 0; i < Atom.atoms.length - 1; i++) {
      let d = getDistance(Atom.atoms[i].el, Atom.atoms[i + 1].el, _x, _y);
      if (d < shortestPath) {
        shortestPath = d;
        atom1 = Atom.atoms[i];
        atom2 = Atom.atoms[i + 1];
      }
    }

    if (!window.preventClick) addAtom(atom1);
  }

  function renderDirectClick(e) {
    let _t = $(e.target).hasClass('circle')
      ? $(e.target)[0]
      : $(e.target).parents()[0]; // we need to find parent atom
    let clickedAtomI;
    for (let i = 0; i < Atom.atoms.length; i++)
      if (Atom.atoms[i].el[0] == _t) clickedAtomI = i;

    let generatorPrevValue = window.generator.Z;

    window.generator.update(Atom.atoms[clickedAtomI].Z - 1);

    if (generatorPrevValue != -3) {
      // if it's not a neutrino, we'll remove it
      Atom.atoms[clickedAtomI].el.remove();
      Atom.atoms.splice(clickedAtomI, 1);

      setPosition();

      for (let a of Atom.atoms) if (a.Z == -1) checkForFusions(a);

      aConversionToPlus();
    }
  }

  //--- Even more boring helper functions. Nothing special. ---//
  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  function pClick() {
    window.preventClick = true;
  }
  function aClick() {
    window.preventClick = false;
  }
  function pIntermediateClick() {
    window.preventIntermediateClick = true;
  }
  function aIntermediateClick() {
    window.preventIntermediateClick = false;
  }
  function pConversionToPlus() {
    window.allowForConversionToPlus = false;
  }
  function aConversionToPlus() {
    window.allowForConversionToPlus = true;
  }

  function hexToRgba(hex, opacity) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return;

    let r = parseInt(result[1], 16),
      g = parseInt(result[2], 16),
      b = parseInt(result[3], 16),
      a = parseFloat(opacity);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function doTheFusionDance(atom) {
    if (atom.Z == -1) {
      checkForFusions(atom);
    } else if (atom.Z == -4) {
      checkForFusions(atom, true);
    } else {
      checkForFusionTriggers();
    }
  }

  function getAdjacentAtoms(index) {
    let index1 = index - 1,
      index2 = index + 1;

    if (index1 < 0) index1 = Atom.atoms.length - 1;
    if (index2 >= Atom.atoms.length) index2 = 0;

    return [index1, index2];
  }

  function isEdgeCase(atom, index1, index2, isDarkPlus) {
    return (
      Atom.atoms[index1] == Atom.atoms[index2] || // if the Atom.atoms are the same
      (Atom.atoms[index1].Z == Atom.atoms[index2].Z &&
        Atom.atoms[index2].Z == -1 &&
        atom.Z == -1) || // or if they are both pluses
      (Atom.atoms[index1].Z != Atom.atoms[index2].Z && !isDarkPlus) // or they are neither equal in value nor dark-fused
    );
  }

  function isFuseable(index1, index2, isDarkPlus) {
    return (
      (Atom.atoms[index1].Z == Atom.atoms[index2].Z || isDarkPlus) && // Atom.atoms are of same value, or force-fused
      (Atom.atoms[index1].Z > 0 || isDarkPlus) && // Atom.atoms are of positive value, or force-fused
      index1 != index2 // Atom.atoms are not the same (this *may* be redundant)
    );
  }

  function increaseUserScore(index1, index2) {
    // what kind of depraved monster penalizes fusions
    if (Atom.atoms[index1].Z > 0)
      window.container.attr(
        'window.score',
        parseInt(window.container.attr('window.score')) + Atom.atoms[index1].Z
      );
    if (Atom.atoms[index2].Z > 0)
      window.container.attr(
        'window.score',
        parseInt(window.container.attr('window.score')) + Atom.atoms[index2].Z
      );
  }

  function getUpperIndeces(plusI) {
    let indexTwiceLower = plusI - 2,
      indexTwiceUpper = plusI + 2;

    if (indexTwiceLower < 0)
      indexTwiceLower = Atom.atoms.length + indexTwiceLower; // wrap around the end
    if (indexTwiceUpper >= Atom.atoms.length)
      indexTwiceUpper = indexTwiceUpper - Atom.atoms.length; // wrap around the front

    return [indexTwiceLower, indexTwiceUpper];
  }

  function checkForFusionTriggers() {
    let fused = false;
    for (let a of Atom.atoms)
      if (a.Z == -1) {
        checkForFusions(a);
        fused = true;
      }
    if (!fused) {
      aClick();
      checkDots();
    }
  }

  function transitionUpperIndexAtoms(plusI, index1, index2) {
    let positionOfPlus = Atom.atoms[plusI].el[0].style.transform,
      lowerPosition = Atom.atoms[index1].el[0].style.transform,
      upperPosition = Atom.atoms[index2].el[0].style.transform,
      [indexTwiceLower, indexTwiceUpper] = getUpperIndeces(plusI);

    Atom.atoms[indexTwiceLower].el[0].style.transform = lowerPosition;
    Atom.atoms[indexTwiceUpper].el[0].style.transform = upperPosition;
    Atom.atoms[indexTwiceLower].el[0].style.transition = 'all 0.2s ease';
    Atom.atoms[indexTwiceUpper].el[0].style.transition = 'all 0.2s ease';

    Atom.atoms[index1].el[0].style.transform = positionOfPlus;
    Atom.atoms[index2].el[0].style.transform = positionOfPlus;
    Atom.atoms[index1].el[0].style.transition = 'all 0.2s ease';
    Atom.atoms[index2].el[0].style.transition = 'all 0.2s ease';
  }

  function getDistance(el1, el2, _x, _y) {
    let HALF_DIAMETER = 7.857 / 2 * window.vmin,
      _cx1 = el1.offset().left + HALF_DIAMETER,
      _cy1 = el1.offset().top + HALF_DIAMETER,
      _cx2 = el2.offset().left + HALF_DIAMETER,
      _cy2 = el2.offset().top + HALF_DIAMETER,
      _mx = (_cx1 + _cx2) / 2,
      _my = (_cy1 + _cy2) / 2;

    return Math.sqrt(Math.pow(_mx - _x, 2) + Math.pow(_my - _y, 2));
  }

  function checkDots() {
    if (Atom.atoms.length == 14)
      window.container
        .attr('dots', '• • •')
        .attr('class', 'window.container three');
    else if (Atom.atoms.length == 15)
      window.container
        .attr('dots', '• •')
        .attr('class', 'window.container two');
    else if (Atom.atoms.length == 16)
      window.container.attr('dots', '•').attr('class', 'window.container one');
    else if (Atom.atoms.length >= 16) {
      setTimeout(() => {
        aClick();
        restart();
      }, 500);
    } else window.container.attr('dots', '');
  }

  function restart() {
    Atom.atoms = [];
    $('.circle, .circle-centered').remove();
    window.container.attr('window.score', '0').attr('dots', '');
    hideMenu();
    init();
  }

  function showMenu() {
    $('.menu').removeClass('hidden close').addClass('open');
    $('#window.carousel, .pause').addClass('blur');
  }
  function hideMenu() {
    $('.menu').removeClass('open').addClass('close');
    $('#window.carousel, .pause').removeClass('blur');
    setTimeout(() => {
      $('.menu').addClass('hidden');
    }, 300);
  }

  window.container.on('click', e => {
    if (!window.preventIntermediateClick) renderIntermediateClick(e);
  });

  window.container.on('click', '.circle', e => {
    if (window.preventIntermediateClick) {
      renderDirectClick(e);
      aIntermediateClick();
      return false; //e.stopImmediatePropagation(); e.preventDefault()
    }
  });

  window.container.on('click', '.circle-centered', e => {
    if (window.allowForConversionToPlus) {
      window.generator.update(-1);
      return false;
    }
  });

  $('.pause').on('click', () => showMenu());
  $('.ex').on('click', () => hideMenu());
  $('.restart').on('click', () => restart());

  $(window).resize(() => {
    window.vmin = Math.min(window.innerWidth, window.innerHeight) / 100;

    window.window.carouselBoundingRect = window.carousel[0].getBoundingClientRect();
    window.window.carouselSize = {
      w: window.window.carouselBoundingRect.width,
      h: window.window.carouselBoundingRect.height,
      radius: window.window.carouselBoundingRect.width / 2,
      circle: Atom.atoms[0].el[0].getBoundingClientRect().width
    };
    setPosition();
  });

  fetch('https://api.myjson.com/bins/qhiyb')
    .then(res => res.json())
    .then(Atom.setElements)
    .then(init);
})(); //e^iπ '21
