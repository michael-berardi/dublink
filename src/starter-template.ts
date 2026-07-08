import type { MenuConfig, Category } from './types';
import { DEFAULT_CONFIG } from './types';

export const STARTER_DISPENSARY_NAME = 'Green Leaf Dispensary';

export const DEMO_DISPENSARY_NAME = 'Simply Green';

export const starterCategories: Category[] = [
  {
    id: 'cat-flower',
    name: 'Flower',
    order: 0,
    products: [
      {
        id: 'prod-og-kush',
        name: 'OG Kush',
        price: 45,
        thc: '24%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Connected Cannabis Co.',
        strain: 'indica',
        inStock: true,
        description: 'Classic indica-dominant strain with earthy pine and lemon notes.',
        priceTiers: [
          { label: '1g', price: '$15' },
          { label: '3.5g', price: '$45' },
          { label: '7g', price: '$85' },
        ],
      },
      {
        id: 'prod-blue-dream',
        name: 'Blue Dream',
        price: 40,
        thc: '21%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Wonderbrett',
        strain: 'sativa',
        inStock: true,
        description: 'Sweet berry aroma with balanced full-body relaxation.',
        priceTiers: [
          { label: '1g', price: '$14' },
          { label: '3.5g', price: '$40' },
          { label: '7g', price: '$78' },
        ],
      },
      {
        id: 'prod-gelato',
        name: 'Gelato #33',
        price: 48,
        thc: '25%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Sherbinskis',
        strain: 'hybrid',
        inStock: true,
        description: 'Dessert-like hybrid with creamy citrus flavor and euphoric effects.',
      },
      {
        id: 'prod-runaway',
        name: 'Runtz',
        price: 50,
        thc: '27%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Cookies',
        strain: 'hybrid',
        inStock: true,
        description: 'Award-winning strain known for its sugary, fruity profile.',
      },
    ],
  },
  {
    id: 'cat-prerolls',
    name: 'Pre-Rolls',
    order: 1,
    products: [
      {
        id: 'prod-preroll-sativa',
        name: 'Daytime Sativa Pre-Roll',
        price: 12,
        thc: '20%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Saints Joints',
        strain: 'sativa',
        inStock: true,
        description: 'Energizing single-strain pre-roll for daytime creativity.',
      },
      {
        id: 'prod-preroll-indica',
        name: 'Nighttime Indica Pre-Roll',
        price: 12,
        thc: '22%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Saints Joints',
        strain: 'indica',
        inStock: true,
        description: 'Relaxing indica blend for evening wind-down.',
      },
      {
        id: 'prod-preroll-hybrid',
        name: 'Hybrid Pack (5-Pack)',
        price: 35,
        thc: '21%',
        cbd: '<1%',
        weight: '2.5g',
        brand: 'Lowell Herb Co.',
        strain: 'hybrid',
        inStock: true,
        description: 'Five perfectly rolled hybrid joints in a reusable tin.',
      },
    ],
  },
  {
    id: 'cat-edibles',
    name: 'Edibles',
    order: 2,
    products: [
      {
        id: 'prod-gummies',
        name: 'Mango Gummies',
        price: 18,
        thc: '100mg',
        cbd: '<1%',
        weight: '10pk',
        brand: 'Kiva Confections',
        inStock: true,
        description: 'Tropical mango gummies with 10mg THC per piece.',
      },
      {
        id: 'prod-chocolate',
        name: 'Dark Chocolate Bar',
        price: 24,
        thc: '100mg',
        cbd: '<1%',
        weight: '1 bar',
        brand: 'Kiva Confections',
        inStock: true,
        description: 'Rich 60% dark chocolate with 10mg scored doses.',
      },
      {
        id: 'prod-mints',
        name: 'Peppermint Mints',
        price: 16,
        thc: '40mg',
        cbd: '20mg',
        weight: '20pk',
        brand: 'Breez',
        inStock: true,
        description: 'Microdose mints with 2mg THC and 1mg CBD each.',
      },
    ],
  },
  {
    id: 'cat-concentrates',
    name: 'Concentrates',
    order: 3,
    products: [
      {
        id: 'prod-live-resin',
        name: 'Live Resin Badder',
        price: 55,
        thc: '78%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Raw Garden',
        strain: 'hybrid',
        inStock: true,
        description: 'Flash-frozen flower extraction bursting with terpenes.',
      },
      {
        id: 'prod-shatter',
        name: 'Lemon Shatter',
        price: 40,
        thc: '82%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Moxie',
        strain: 'sativa',
        inStock: true,
        description: 'Citrus-forward shatter with glass-like consistency.',
      },
      {
        id: 'prod-rosin',
        name: 'Solventless Rosin',
        price: 65,
        thc: '75%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Blue River',
        strain: 'indica',
        inStock: true,
        description: 'Premium heat-and-pressure rosin, solventless and pure.',
      },
    ],
  },
  {
    id: 'cat-vapes',
    name: 'Vapes',
    order: 4,
    products: [
      {
        id: 'prod-cart',
        name: 'Strawberry Cough Cartridge',
        price: 35,
        thc: '85%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Stiiizy',
        strain: 'sativa',
        inStock: true,
        description: 'Sweet strawberry distillate cartridge with a smooth finish.',
      },
      {
        id: 'prod-disposable',
        name: 'Live Resin Disposable',
        price: 42,
        thc: '80%',
        cbd: '<1%',
        weight: '0.5g',
        brand: 'PlugPlay',
        strain: 'hybrid',
        inStock: true,
        description: 'All-in-one rechargeable disposable with live resin terpenes.',
      },
      {
        id: 'prod-battery',
        name: '510 Thread Battery',
        price: 15,
        weight: '1 unit',
        brand: 'PAX',
        inStock: true,
        description: 'Rechargeable 510 battery with three temperature settings.',
      },
    ],
  },
  {
    id: 'cat-topicals',
    name: 'Topicals',
    order: 5,
    products: [
      {
        id: 'prod-balm',
        name: 'Cooling Relief Balm',
        price: 30,
        thc: '50mg',
        cbd: '200mg',
        weight: '2oz',
        brand: 'Lord Jones',
        inStock: true,
        description: 'Menthol-infused CBD balm for targeted soothing relief.',
      },
      {
        id: 'prod-lotion',
        name: 'Hydrating Body Lotion',
        price: 28,
        thc: '25mg',
        cbd: '150mg',
        weight: '4oz',
        brand: 'Cannuka',
        inStock: true,
        description: 'Creamy daily lotion with CBD and manuka honey.',
      },
    ],
  },
];

const SIMPLY_GREEN_DEMO_IMAGE_URLS = [
  'data:image/webp;base64,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',
  'data:image/webp;base64,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',
  'data:image/webp;base64,UklGRnIHAABXRUJQVlA4IGYHAAAQMQCdASrwAPAAPrFYpU6nJSOjI5UpWOAWCWcQ0lVauEVKcLr0u/8Pp/7bDuiG9nVfP+F7jvDDXRAXL4bu2Z4n2QAsm79IPA3I9AhwOnMRI4IolEmNF0YU+5K5ee09GA7JP23aZIJhmc7bP/Qtn+GOJypXJWN9Cez/kVPjVKOTKoGIljRBVVW3ayzfPN+svHr2D6oYGxs9K3tabZfGXPQQ6e7rtBRK/IZ9ZbT9uBW75vhpvhOXpKCTfi36CYdvxRYdDipraa8sBxxR63H0LCnh9cAa/agVARsQ/1x6qzd2NhBcBdb7GHdw2FzpU6cxnytEEA9waRSPjT7yivRDwlMdrX9XU5yf8KJyFuy4alY+IsK4OcKBz013UHdsvYSzV7ivGqWVG+eDGWg44loNCs43XuMkzIEPRIqF+tB8c5TafhPb1WIXLfI0QM0R1lRkDLvKbDorUzJNxJ7K8SiJoZMGCkVTNW61KZPItTVaDrr3704/5slNAgg4C7zntPuNrgBWOR46mqbRd40qPiK5YyUq4AD++gk004I4HjqdZakMOXd9OIr7/Z8cFmEvNDArJN3c6eYD1WDg40JUYXN6jMBllBNd31RYejv44KOsUq7YNturZHF20IF9kYsoeML8uKI3RNzAINJ+4GZvsJAXOJjeeTdRa7MYbg+ZJOZ9bZwG6j2xqIh43sjzXYNtcM8OnPKL6hGpb8BJHdAIsI2EjErk+6Yjntd5oO5cnYkRfdKeIwaV4uus8XgYSU/KRd2FZrwZIO7Tc8B8hPyAzYt8i97HYt4uHn9a8uG5kJaRWaR7p47suCwOZfBGbszlvWGwYH/MweN5uWLWbtillzBcX+ki2eblT9byf0FSte5lAffw7UJxNrRctRXAlG4Ly+Qu3z6t4KqdF2d+Gu5RaKYfwwQBStZ6rgRsVu2YT/IfVQ4LS9L2atR0uYhv3/c/eKm/lf5UxmibxQYja3UHmTI8i1cgf+rCj/V+fIoGmMivbfsvX88tm+DZIJ82Di3HUBHH6pMHDjNR4s4SejR+dyNNv2ANcFKQvL3laJo+RAlrrpiRVcjMmcdzKIKFzMAV8X2VNyGERN5LC4GQ81eCU2FOa2wC6t78tFWKiN4JSXkhyZoUvAwjPFNnShduGwxUnthUdhrUzibqlRPfBLe40KnUMfyRZPhB1fvZh8I2j2Yx+LdpkV22bG1fH9DZkyWu/z8fMatmbmAdXuh78bBtfCWn84G58mgtrJ0oUppSMidZU1L91y2Iq03NNDe3Gs44AK9+71DFzklEk1mBHgP8gTpsOoLSlQASCYCZn2vAWr4+NyaKBsbsxSjGIxSjHVgTFhPgFBQJBhsGkSF1iCyoq+SnNHrCgCC0p1bELuksxDpCW6tR0d2ymHix9R9WVGP2Zh72yEgR6T+MaFtl0i0EFOyUivO6K/EySS5oOqnLQW148SSvFEDawm9KHh4oYA6IFEtwv5n+mVS69EDTf/ePtEL7UPnS30cr1iJWegkrtayUjst9kZV/3k8Wx7ec6hl/vfEnRcePg+mi+5aPB9uxyocRjEhsfsLQpINTkkXsI1rg3aNnbpcSfZBM9gepjq6YWPc+9K9nl40LQ1xc+3pkCbFEBsdeDUrrz6ORj1IhD7XRVKnEoCJRnpmJl+OLgO22wc28+G9+3Hhagjkpts4zGrtneZap8R8kGsUR/MUm0gLiw3s+vmtGcxFW7yaQ7HwBitV+lByH+Tk05K1QBkAJVLAfkR3TvGXC9/UBYubfyK0FLdS/tCYnsuNh0/fprvejhMKuI9kzXbxVPXFM5kbtvho5MWyiSIJbF5vEBc2+/4FkdsJzMAcyy/8ndAGN80K9d2AQtT7N3gIqGjw68ib5qit+iENsQsoFXxby0PybiT+gE3UA+k7h2B7UCHkhnsISBFqLDZ4hZq5Kq9XGAeFcs/SkrwcTEcqOo/rzkQa77N8PAAjBJ+BbcZC6ORtxx05TSOFMew4RkHB57WRdHAzNgXpGbNwg0H/wQZkweJlFsv+gTLi75DqCX2j1A31HTeRi3S/B0O09XNMNm8nx72SDaLo+t/7qzE9GPBgu5z3tmUf2Bn7SM9eDo17RMolj0tUnyzhzpUyXz0f/893fu26X4UsvPSSRhqRcXzM3xoNRnpms7g710O4P6UXQYiB0/0HqXry/ahC7cNeyxu2ltZfF4IPQPGoIZuu4gVOrCTyYk2/BXM+kH6qCaEdb1/47EfDoIqiBvS07ERlF9qhD1TkZ7/XSxP9BmwCFyF+QklsHXBF8WMuJGPlqjaxZpF+zKpsX5vhi7Jp8gOdT49Up9Sqf0bmFXwvS9oXpB1YPDK7VCxQtUcIWfUoA4T0rgSnZWHepCt2EgDjk69Zq6b1UiFYBo7XAr/Ub/AeF8146iJnHB+pfMSS38rRStDI3VMYK0g3erCU4Fb7tuPOdH7lRKR5LgqFLAHlW2qPa+ypd3UkJYEE3j6vkypumYY1Y16qviacAIQ/6t7flbwawDUxn8ji3iJcFU6sSLynlYAAA',
  'data:image/webp;base64,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',
  'data:image/webp;base64,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',
  'data:image/webp;base64,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',
  'data:image/webp;base64,UklGRjgLAABXRUJQVlA4ICwLAADwRACdASrwAPAAPrFSo04nJCMyI3YKYkAWCWduveuj61C7paj4X++h7PlE2y6Qh9uSR5k9fn9HDlUmr+VhA+ZS9O80ulbPxGTsrEPbGD+1vvCSL3uIZmdfp+firXAc5UGTKzY67+aUqpGJ/AwbrvBshiz/ulssUhoXLmL+G6qqEvZaIqzJG5V23DjH6YA3aELncAJ9TgC6J7vxjG5++TqGJnRh1tm+NtVyBWipM5DMyu5wTsVBU/Vx/7ZK0Oiyh5WZmWxCOzpQwZFel77PSNkoHo85YTuPkFoGj8oc/dLXPmZZ5UzfdJEFVWu9HUz+qomhOlRYDW/vz/A5pYc0lvwwbwuDQHNibhAH9bV78Ndpq8L1MayvCiE9EFcU+YGQOiWPSMIUEGNzcWBlTQ/vJHL2v0gNRPK61kp4au9aS7O8gHbH3dR9jwXyUoOyuJxkZodWa/7kh5nsXW5wpi3qUqU76iKls8XrGsdSBenJGlG6o4SNMWBv+h7qWDLcu8+uWqvhl/iOKBa1c9tTm3/ekLU/9XqGnFakmv3V+bLlG9fzQem8bbjBHsnFaaUStuGM8pLvE6BwVABeMrsQVT626ko1ypFTg5OJbu0sGIl9jhTvN+5+VOxQRjQNS4g9Zjb0XPMk+pqggxc8Rvw3pBuKPw+DtD+CWDiiNgk8GbF4kg3VtLk9iP7Bnh0lT0aywiRs42yHLls7x8rYGjqEbtWJmhpMWf8GFoWiUh/zm41aW63jYAD+/K0R4saqk/VUfE40UZBh3+A3HG4MOpYkGSKFVp9onAERlbd3usR1KtlFQBT/zm35uOZPhEXsU29udm4dDmmB4C8EYHXrIUzWDGpGUym06o70KvQ0e4kb0FH7afcvifT1PWVfU1gGPtgnkF0lNu4aZOexzg95FvKAZ5fzAG3I0HaSc/Q+0QRR/H7vRziBi2qfDEABP4H+svxDbV/ZgdVtua2comGuyWJojkZzie20W0VEjc/EUCG6EiN3dIsdVCZxJACH5F4E2F5Ov9O+ETnOH/QAApFl9gvmSH0zYOqdmteIFdbL2qrTZvvnG2dqMbe40TsCmiFXQNs7Vh74H2zPH2mV1kXoncTaDxBxi2T3l8SpucBUBzHrJoJOz+Y3bYnhFuqVZ/p+dq9XKXx2NZnS+IGY6LD9cvSp9aoXhC31YmVrvL3+6onEeADNF6jssi32TbXloHQD8vnbc3cGuVlUnT1YOdDAR00v+y63hXmoqHfH2mPX+6vx0gihVaGTpQlRORC+grpzT3hzCNYP/wUKobQepBOa602oCsoPJhhUTP2QVg2lmqodhOpgZQIHM610BfW+lVEwIIXTOVHd0bZmuLCHJzoKRAYVzPP8M97C499DsHCVTpix7QwtEgMt8Pe55gNEc9jYE6m51P/TZS+1bJuRx4CCTjwzKVenESBPX9fj7c8stHxXEpWRkXRGhkLXNYgHrk/xT2lxk7i+It+YFF/jU0KMG5WmhOH5jDj+7osrD8h8TmfbJNXkq0AyqoJB5lu/M+Qt8CIMapy+zzZS3IuNISO8BLMAoK8HBfMVpWpEILIpsy7v0TlL58BEkWdwprrLT+M65p5QAOszyAG3j+oNalt4ZDYUA9V61aqUO8VHobm1m+2YoAK5qv2dwYDZhNcJBQ55ZO8mwSHdDB2OUzvjANXJqmGNLbDSvOSlOGHonHtguTnHfB8Ez2pgq7q3tYMBFH6avS/obdqZA4H5oXUnCi5Iv2UqQeB9HoN9LbMUEqdJmfTlqnt0gn7d6iFju3rh6PTkh4uZHmB4OVqPHr0m5+Z6zSxZO30q0prDh3xO8FhjAEG19yQ3Go63j5unoNYbkF0CrQuRHcePDAfy7jrEiuywaxumkGkHbOcaesvf70Sggwt0svXVL9j9JVWxlG4YmU7rhMs4dxJ8V/Pn+Kera49lvGu8roRqrHw2gsTYN5kKKwN2YhNSVThURy6uPmCWfLNF7VANt1m4m839tnuAgMquKpCf5A45v4f2uOvyrphZ5+Hj9+dlBEtl9QQi4rkYWAF6kyUDrlqJ3vVEUi/REStWv64oMSgM6dodUNogQxE0u0CEQKpfFFBOBq13tbrDPPAp2R2iQO4FhMRcqQLcxv28FGuLHgcLZJrQKW8Tj4dNqxErqQT/ZJQ2fpxhPC+eh/eSie2PjBLB4TrcZ1EnFAM7a2AX4FFBF/v8+thEPZ4Xqj1XEqrh2avcTKgrNW5QsJrYfYqf+ziJ4LhJkkZA7EXOJBSbOzmJhhC1H3yyo+RpRVa4pq3BLiLiunc+iZrRdm7c5Xu5Dzu2eQBjpML9U08wo0eMOwLP+Ngvhra8Rm40IRfNyg9RvNIaf6DhHx0Fz1oOBXbk4d60L9FMO6zU1sKspn5FMGKx/sMJ0mADDNKwcIUOvGIFX2cE/UjBN3NkoqhZ8u5Q7RaJ5ZTz7E2682UoBo5c/G12E5xb+9CdmbIfKz2bOwGI+OYYPhsVOokz0WOun9Y1nqdf9CHH/i5OkQQFfOu3wWujHXmgxVFcVZl7BIrFG5M9sCnQGA73BSgzELpE95AV5AcvH74f/T9e51ZC16olPgP6qkqIeMaPJTHNCdwYs9jLlwP2migea3FKbXw9O5IMhk/3vmk355kGEBxFKaUfN7EjQFP5rFbLcZ2Ng6a/IZwqgYt/yz9u5P4r8JLKnlnfB3ZOstzWm8AZTz9N1Dma/NZwN/9HbxZDh+WmfOZZmykcGb3sU0w9pMcQNMwYpRtxEowrFyGuNDKuoCAyMgdC8pbdSa8ckHuyCfK19zb9d9R15FoXKIRoWuL8tstcuWLMc5HvcXFc/egiNkaqxUl+YOD2Xp2haC1LCd+RggijS4eocGeOIfYD9p/MBJx632Kmg639BqBK6CNTAH/astdyIHtf3q6KzGKoWjRe2Aw5scU2D4gbIjBJfWKkhWz8Rw/R3pFgXY7+Fz+k8tBbYB7TBSlmfMsNkF35TUa+2pgcrnU6AWNTpI7jCZKAu4AA+yDPplSca6CCxSA77pJur+tDwgw8ewbTeLWuF1fBMNdqKjH5CRXSU6PRUY0b8uRoZF2dup4rPIGBy9gUhLhiLjU6rEQDRHVlll+BcNQiaeFGysgvpue7eDbrDfP2F+u0sH+7mvHhM5SbB6PCGt7/9CtCwl5cp3uc5JiA+1vFr24lJMjo3baG0GdX12mqXH3GRCQaH1WCdfgwshIPfxK6LebsH0UdLLxuFlnjzAE4suPNklT4EB46bYEhE9yULhZb/GmJS61uvSz4B3JDqiO44hKDtpX3dmxOcYmvp/YifDjjmqrHStp0zU9333BD7rIl/nZgwZxbHljRtlbQpiVXduAwLED80JNWBdigfivZHyUGf6ZoJaJkYJVjhHsNvR2i8BeaHg8Bto18lhHD3obUu8v/zXM6bqfepd+8Cz+x24cCbEkNqz3pwsSn+nj+ANc2pktuECc00eQOMzcyFCGuTR7hZlkAT5TnfcFH93h1Ea1SbXmqYYf3fCaV7yzHSWO+GrsElRFbqAXErZrbuNNTTU1s0niJWtYiVi9GeMyAwVZL4qLJuvhzRcV6duriAhAALlMYTKsBKQQJKuAXatPFnE67ZmNpI1KC4aER/gl92JsS+k0zL0EPp9jEUtC5QC+YFigenw67hyAUQnCD8DWBjjSnJEsVgIBlgD9q3ukR+I2cUpa/NIxu37lNc9py7PX5NHa4FBfOHZw+hRjnRz8L+WRUbR2yV7t0i7B+qaBeDgVKY4zm/p4oMun9JUYFDYQjUIqAhvVi4LNgZFae2obdZL/Ky+UJYuiu/CL0QfjgdvZwEgAA',
  'data:image/webp;base64,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',
  'data:image/webp;base64,UklGRpoEAABXRUJQVlA4II4EAAAwJACdASrwAPAAPrFYpU6nJSOmIRSaEOAWCWlugbEi+hLI/vkYFU92S23ImQofrEGx25sMNWyvF3IOc7lG0YYnZKOrpZKb6e0hWGJGMQSUi4s7xbOK0FsPTNFsd4UQ41O3HcBEXU/yYkgjlazlYBT/JJTrhuEwygLtG96YZgIbD7r/7H6Y7Vo/LcnM0OzBPH/FODOxMZBu+SRRST8lQfC6x18LQtUByjKuRnE8MwkY5OAR/Bio77e6fyX1g7LiLCP5t7V1NGUdAHGvEPpoQhm73dCZ0twW/YYGwvx7wixv+lQ3MpsxFERfI/qBj5/xI2Ty1D7LLw+E3cQkEglo+8H/QLMuEfsSWgwzsbwEK4039qxZnHgH7OI7TtaHgkHBRiRXMldYO7m3sOUAAP77FPPKVM2ngIOrr85kFj+IOoMGh1+ylT9deZsSoF+0u3gawtLXc0XtkAXh47BIwoDLDe2LHH9LRdGuccoNBeYFr+AXc4d0ldNEWzJjGqjnOQDrzASa5f59EnMf1u3i9ihEe+34Ahhl71ZJiXzCyUTe8DfNkmF9BxdffXmowlqNlOUhNUTef+VLfl9rjjBIO+pf0kw1BHRrzR4W6V4lawtHsXruCWBOHFT8D/q+vK5K2dEe5XQU/UAbfStN4LK9ZL1A7NirjUw/k8wJ1tykI9ox2M7ud7+bRQK7kTso9MMJT49Qmt3OuRtODAXdwwIs/a9gsM3FOUwRD3jZpHGgFOikloJEYPBj81X/NAjOpiCzQ5Yvdm2lT6L0UBNOlQz43TC1hIpz8RhTCucQuui5MPdbURdLm0nbXtB274NcEMwo8xU6mxEDcob2yo8I9TlxtkQqy9vpxM7he+tB8UkJjLBFEOj6WeKTa/ZvA2eqaNbRLOdX7SKZa8Xeqt/q9grDi7vwZlPEta/mki9oTXfWR7+J7tdq7EnPimGcu8npe1BsJuvGtYNWT4BHPwcPfW9xbSh6lC015AJ1/tTNkG9AJ+PxDPsLPJyAXetIWkCZY+b3GDlJZdBZ9v/YNTUQgC/pxfVgEIostczaGfR8mnH9jEsP16XJtjLsOzOGMCgNsUl+0z+t7IztK+k7Pti77IC3kIjrP5EI7vNQ4JaSZtxT2cjurFGGyfOjcrapWy8Jo+dbaX+AEyZZ4D50vBxwJ9GJ75dxd+AAgck0IibUp/MWGS/Il4lQy7XONfhF2iQtWlVtmlptY/hfyvm4uEKm3xIlEv6qCbLS3hZWsKvlhucQHcLi1dbcCVcmlzcE1EBdFld++7zixOdBpk/eiCrv67W0tqYXYtxdOI3MO38cDgHrmLkNl6erlrZ0OSy69wKFKLfd5zS9BgYvxZ/7I7TCd+6By4/iL0Pegg187uXOceSYA2rrpACAVYj/edUBlNwvzid98fZ1zhtQJqL2cvqOOntr1vP7hTdb1nPAPWXfTizF9tSe/2h0uSf5vJBIV1o08HPVOEM0FIROuet/uyN0Wm6xr3Wl4RG3UzTlwvmM0PmqmfXimpP6MpjqlRiBvji7udYqL6ZUC2GFBpoTRkPb4RKn3PQAAA==',
] as const;

function simplyGreenDemoImage(categoryIndex: number, productIndex: number): string {
  return SIMPLY_GREEN_DEMO_IMAGE_URLS[(categoryIndex * 3 + productIndex) % SIMPLY_GREEN_DEMO_IMAGE_URLS.length];
}

type DemoCategorySeed = {
  name: string;
  names: string[];
  weights: string[];
  thc: string[];
  prices: number[];
  strains: Array<'indica' | 'sativa' | 'hybrid' | undefined>;
};

const simplyGreenDemoSeeds: DemoCategorySeed[] = [
  {
    name: 'Flower',
    names: ['Blue Dream', 'OG Kush', 'Gelato', 'Wedding Cake', 'Sour Diesel', 'Northern Lights'],
    weights: ['3.5g', '7g', '14g', '1g', '3.5g', '7g'],
    thc: ['22%', '24%', '20%', '19%', '25%', '21%'],
    prices: [35, 40, 75, 12, 38, 72],
    strains: ['hybrid', 'indica', 'hybrid', 'indica', 'sativa', 'indica'],
  },
  {
    name: 'Pre-Rolls',
    names: ['Classic Joint', 'Infused Pre-Roll', 'Sativa Blend', 'Indica Blend', 'Hybrid Roll', 'Mini Joints'],
    weights: ['1g', '1.5g', '1g', '1g', '1g', '0.5g'],
    thc: ['18%', '28%', '20%', '22%', '19%', '17%'],
    prices: [8, 15, 9, 10, 9, 14],
    strains: ['hybrid', 'hybrid', 'sativa', 'indica', 'hybrid', 'hybrid'],
  },
  {
    name: 'Vapes',
    names: ['Blueberry Cart', 'Tangie Disposable', 'Live Resin Pod', 'CBD Cartridge', 'Pineapple Express', 'Nighttime Indica'],
    weights: ['1g', '0.5g', '1g', '1g', '1g', '0.5g'],
    thc: ['82%', '78%', '85%', '0%', '80%', '75%'],
    prices: [45, 35, 55, 40, 48, 32],
    strains: ['hybrid', 'sativa', 'hybrid', undefined, 'sativa', 'indica'],
  },
  {
    name: 'Concentrates',
    names: ['Live Resin', 'Shatter', 'Badder', 'Crumble', 'Rosin', 'Sugar'],
    weights: ['1g', '1g', '1g', '1g', '1g', '1g'],
    thc: ['78%', '80%', '82%', '75%', '85%', '79%'],
    prices: [50, 40, 55, 38, 70, 48],
    strains: ['hybrid', 'hybrid', 'indica', 'sativa', 'hybrid', 'hybrid'],
  },
  {
    name: 'Edibles',
    names: ['Gummies 100mg', 'Chocolate Bar', 'Mints', 'Cookies', 'Brownie', 'Soda'],
    weights: ['100mg', '100mg', '100mg', '50mg', '100mg', '10mg'],
    thc: ['10mg', '10mg', '10mg', '10mg', '10mg', '10mg'],
    prices: [18, 22, 15, 12, 14, 8],
    strains: [undefined, undefined, undefined, undefined, undefined, undefined],
  },
  {
    name: 'Tinctures',
    names: ['THC Tincture', 'CBD Tincture', '1:1 Ratio', 'Sleep Formula', 'Daytime Drops', 'Relief Tincture'],
    weights: ['30ml', '30ml', '30ml', '30ml', '30ml', '30ml'],
    thc: ['300mg', '0mg', '150mg', '100mg', '200mg', '250mg'],
    prices: [45, 40, 55, 50, 48, 52],
    strains: [undefined, undefined, undefined, 'indica', 'sativa', 'hybrid'],
  },
  {
    name: 'Topicals',
    names: ['CBD Balm', 'THC Lotion', 'Transdermal Patch', 'Relief Cream', 'Muscle Rub', 'Face Serum'],
    weights: ['2oz', '4oz', '1pk', '3oz', '2oz', '1oz'],
    thc: ['200mg', '100mg', '50mg', '150mg', '250mg', '75mg'],
    prices: [35, 30, 12, 28, 32, 45],
    strains: [undefined, undefined, undefined, undefined, undefined, undefined],
  },
];

export function createSimplyGreenDemoCategories(): Category[] {
  return simplyGreenDemoSeeds.map((seed, categoryIndex) => ({
    id: seed.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: seed.name,
    order: categoryIndex,
    products: seed.names.map((name, productIndex) => ({
      id: `simply-green-${seed.name.toLowerCase()}-${productIndex + 1}`.replace(/[^a-z0-9_-]/g, '-'),
      name: `${name} ${seed.weights[productIndex]}`,
      price: seed.prices[productIndex],
      thc: seed.thc[productIndex],
      weight: seed.weights[productIndex],
      brand: 'Simply Green',
      image: simplyGreenDemoImage(categoryIndex, productIndex),
      strain: seed.strains[productIndex],
      inStock: true,
    })),
  }));
}

export function createDemoConfig(): MenuConfig {
  return {
    ...JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MenuConfig,
    dispensaryName: DEMO_DISPENSARY_NAME,
    categories: createSimplyGreenDemoCategories(),
    disclaimer: 'This Simply Green demo menu is used with permission for visual QA. Product availability and pricing should be verified before use.',
    tvDemo: true,
  };
}

export function createStarterConfig(): Partial<MenuConfig> & { categories: Category[] } {
  return {
    dispensaryName: STARTER_DISPENSARY_NAME,
    categories: JSON.parse(JSON.stringify(starterCategories)) as Category[],
  };
}
