Write

Sign in
Creating and coding a Design System from scratch (co-authored by Zuzanna Sobiecka)
Guidelines and considerations for developers and designers
Cesar Martinez
Cesar Martinez
17 min read
·
Jul 7, 2023

After working as a frontend developer in several companies with varying practices when it comes to using (or not) a Design System, I came to a couple of realisations that I'd like to share here. You'll note that many of the teachings of my previous articles regarding frontend architecture (medium, dev.to) will carry across to this one. Those where about managing increasing complexity in frontend logic, this one is about managing increasing complexity in the design and its code implementation. Just as the better understanding you have of the Domain, the better the code you'll write for it; the better the understanding you have of the design, the better you'll be able to implement it.

The talented UX/UI designer
Zuzanna Sobiecka
co-authored this article. She reviewed and revisited the design concepts presented below.
What's a Design System?

Suffice to say, for now, that a Design System (DS) is where all the rules and elements of your product's design is laid out.
Why would I ever need one?

As a company

    a DS provides consistency for your brand: you benefit from a DS when you have a particular look and feel that you want to keep across all your digital products, or across one large product being worked on by several teams.

As a designer

    a DS provides speed: you want to streamline the ideation, creation and development of new UI, pages and features.

As a developer

    a DS will provide the basis you need for a modular and reliable Component Library (CL). Unless you're using a headless UI library, you pretty much need a DS to have a usable CL.

Limitations of a DS

As we'll soon see, a properly implemented DS comes with some strings attached. A company or its designers may not feel comfortable "shackling their creativity" to a DS. This is where it's important to make the distinction between marketing design and product design. In the former, the intention is to capture attention and the value of consistency is not as high (mere recognisability is enough). In the latter, the goal is to achieve the best possible UX, and reusing patterns that users are familiar with may be preferable to unbound originality. Some branding guidelines may suffice for marketing, but a DS is what caters to product design.
I'm sold, where do I start?

The good news is that, even if you're already working on a product that has many designs but no system, starting to create a DS for it takes little effort: we only need to be systematic about it. If you're a designer this will be very easy. If you're a developer you may need to learn the basics of the design tool used in your company.

The design system can be derived from the existing design, or the existing code

This means that you don't need to take a week out of your normal workflow and come back with a fully-fledged DS. Depending on the development stage of your product, I may even recommend against that. We can just use your current code or design, whatever is closer to the desired state of the application (or whichever we intend on keeping) as our starting source of truth.

First create a new page in your design tool of preference (we'll be using Figma in our examples), and as you're working in your regular tasks (designer or dev, doesn't matter), start listing on the design tokens as you come across them. You list as a design token elements like colours, typefaces, font sizes, font weights and line heights, spacing, border radii, icons, gradients, elevations or shadows, even animations and smoothing curves.

We underlined the importance of ubiquitous language to simplify communication between Dev and Domain in a previous article. Here the design tokens will become the elements that simplify the communication between Dev and Design, a common design language.

If you're familiar with atomic design, tokens will also become the quarks that make up the atoms in your CL.
![Atomic design taxonomy](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ysKM-_3gJpbG5SL_CQDN8g.jpeg)
Press enter or click to view image in full size
Atomic design taxonomy (src: https://specifyapp.com/guides/design-data-platforms-101/04-design-tokens-and-assets)

Eventually you'll end up with something like this:
Press enter or click to view image in full size
![Listing design tokens as they appear](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*62dxSkdwbiDEO07rzj1Pig.png)
Listing design tokens as they appear

This disorganised mess is a great start! At this point we're just listing the tokens out as they appear whenever we see them, without any further consideration.

The design system doesn’t need to be complete for it to be useful

As you continue down this path, depending on the development rate of the app, and specially if both designers and devs are listing it out together, very soon you'll have a very big list of tokens. It's not a DS yet, but that list can already be useful. As a designer, if you find yourself creating something that isn't in the list, you may take a second to see if there's anything in the list that may do the job. As a developer you can also bring this up to the designer when you see it, and you may also realise that if something is already in the list then it means that it has already been developed, so you'll want to find and reuse that code when possible.

As the list grows, adding new tokens becomes less and less frequent (because most of them would already be listed). At this point you'll note that the format we have for our tokens page doesn't really make it simple to find things in it. So you take a minute to give it a bit more order: this is the step 2. When you're done, your typography tokens may look like:
![First try at organising the list of typography tokens](https://miro.medium.com/v2/resize:fit:1084/format:webp/1*mGKtE62yJoWzjB491W-B9Q.png)
First try at organising the list of typography tokens

This not only makes finding tokens easier, it also makes the relationship between them more obvious. This already leads you to make a couple of sensible decisions:

    You realise that the one time you used Martian mono was actually a mistake so you leave that one out and update the design and code accordingly
    You realise that the one time you used 200 font-weight was an exception, so you leave it out of your list
    You notice that the sizes 10px and 11px are too similar and decide to keep only 11px and forgo 10px
    You see that not all font weights use all your font sizes (11, 14, 16, 21, 24, 38, 46), but decide the keep the gaps to show that they can be filled later as needed

The patterns are now explicit: Rokkit is only used for Headlines and always in bold. The body is Roboto regular, while subtitles are medium, etc.

By the way, if you come up with a different way of organising your tokens that's ok too. Choose whatever makes it simpler for you and your team to use.

If we do something similar with the colours we may get:
![First try at organising colour tokens](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*trP23shzxeR9IwFFriA5Nw.png)
First try at organising colour tokens

Depending on the size of your project, your list of tokens may be much larger than this small example. That's not an issue, let it grow as large as need be. The only goal of this second step is to get an overview of what's being used.

What we have now is still not a Design System. In order for it to become a usable DS the developers and the designers need to agree that the organised list of tokens is going to be the official (and definitive) source of truth moving forward. Before that happens we need to get it ready to be used as a source of truth for both devs and designers. This is when organisation becomes important.

Aside: where do these names come from?

For our tokens, so far we’ve used words like headline, subtitle, overline, primary, lighten-n, darken-n. You can use whatever names you prefer. However, here’s a pro tip: if you don’t already have guidelines, grab them from an existing system! Material design is a big open source one you can leverage. By doing this your DS basically gets free documentation which will be handy for both designers and devs. Names on my examples come from the Vuetify implementation of material. Ask your team what they know and use that!

Make the tokens explicit in the design

If we have a list tokens and we agree on a naming convention, we’re ready for step 3: turning it into the source of truth. This means that the tokens will be used as the compositional elements of designs:

    When a developer looks at a design, the tokens being used should be visible and obvious, and should follow the agreed naming convention.
    For the designer, using the tokens to create new components or edit existing ones should also be straightforward: it should be simpler to design with tokens than without them.

There are a couple of things we can do to help with these goals. I'll show Figma examples, but it's likely that similar features exist in your design tool of choice to make this happen.

Typography tokens

In Figma when you're on the Design tab, you can click the + icon to create text styles:
![Creating text styles for your typography tokens](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*a9tY4C0ICN7sOdxDtyOOzA.png)
Press enter or click to view image in full size
Creating text styles for your typography tokens

You can then use your text styles to immediately style any text in the design:
![Easily apply text style tokens](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*nWFvcVSPjNIiu5AYMvounw.png)
Easily apply text style tokens

Also, clicking on any text will immediately show you the name of the text style used:
![See text style used](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*wLqDs4URLY-Rd1-yISJSwA.png)

Every text in the design needs to be using one of these. Both devs and designers have the responsibility to make sure that this is the case.

This also makes your DS easy to update. If you decide that the style of the heading 1 should be something different, you can edit the text style and the new settings will be applied everywhere it's being used. As we'll soon see, developers will also code the system in a way that makes changes like this propagate automatically everywhere throughout the application.

This is how the typography may look like in your DS once done:
![Example of typography in a DS](https://miro.medium.com/v2/resize:fit:1248/format:webp/1*R1jW0DXZ1F9su_ZGRK2DZQ.png)
Example of typography in a DS

At this point you can have tokens that aren't used in any designs yet, but there they are if needed in the future. This is encouraged: completing your system (filling the gaps) will help designers do less guess work when looking for appropriate tokens.

This works not only for your typography, all of your other tokens can be integrated and made visible in the design in a similar fashion.

For the colours, if you click on the colour square you can find the + icon to add it to your list:
![How to add colour tokens](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*8-IVWXBSXuUzOcaZvyN4gQ.png)
Press enter or click to view image in full size
![How to add colour tokens](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*fpEVZG77Xh6FeLST5eOQEg.png)
Press enter or click to view image in full size
How to add colour tokens

After you finish adding your colours, you may end-up with something like this:
![Example of colours in the DS](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*s6CG_cr1jQSA4JVb__VZKw.png)
Press enter or click to view image in full size
Example of colours in the DS

Your system can have as many brand colours and as many functional colours as it may need. What's important is to have them named everywhere they are used in all designs. This is simplified by the fact that whenever you click on an element that can be coloured, your tokens will be easily accessible via "Libraries":
![List of colour tokens in your library](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*6OIQw6O8wyc-Ekgfkfxo3Q.png)
Press enter or click to view image in full size
List of colour tokens in your library

New feature!

Figma makes it easy to surface your typography and colour tokens. Borders don't have a dedicated system, but with their latest release (June 2023) Figma includes a new variable system that we can use to store and reuse values:
![Using local variables for border radius tokens](https://miro.medium.com/v2/resize:fit:888/format:webp/1*3md95ll49zjnR3wJPxfn0A.png)
Press enter or click to view image in full size
Using local variables for border radius tokens

That new pentagon icon will lead you to the variables menu. When you add the variables you need, you can easily select and apply them where needed:
![Accessing existing variables](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ye5nWNo3iRE-ySjiyeLtlQ.png)
Press enter or click to view image in full size
Accessing existing variables

You can also see all the local variables next to your local styles. Just like with the other tokens, you can now change the values of the variables and the changes will be applied everywhere those variables are used:
![Rejoice, for Figma now hath variables](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*SS-7vQSbRDc0aKGcCV4_aA.png)
Press enter or click to view image in full size
Rejoice, for Figma now hath variables

You can also save your blurs and shadow tokens using the Effects tab. I'm sure that by now you'll be able to figure out how:
![Saving shadow tokens](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*X3A9usZimLweofDztC66Pg.png)
Press enter or click to view image in full size
Saving shadow tokens

We have to point out, as a side note, that variables actually have many more uses other than storing tokens. They can really superpower your design process. Check out their guide to learn more.
Get Cesar Martinez’s stories in your inbox

Join Medium for free to get updates from this writer.

It's important to understand that the format you use to present your tokens doesn't really matter: choose the format that makes sense for your team and your product. Most of the value of this exercise lies in having every element in the design made using the DS and its tokens. That's because, as we'll soon see, tokens are a design language that your devs can understand and implement easily.

If you reach this point your list of tokens has become a usable source of truth. Now your DS isn't simply the place where the rules and elements of your design are laid out, it's the dictionary that defines the design language that will be used in your organisation.

That doesn't mean that your DS won't change. Au contraire,

The DS doesn’t need to be static, it can evolve.

As we've seen, the system actually makes it simpler for the design to evolve. However, a simple process must always be followed before any change in the DS can be made:

    When creating any new UI, always try first using available tokens in the DS
    If the new component needs a token not included in the existing DS, then the new token needs to be added to the DS.
    Designers: if you notice that the new token doesn’t really match the DS, then try harder to see if you can get your design to work with existing elements.
    Devs: don’t implement anything custom in the UI (no custom sizing, spacing, colour, typography, etc). Devs: if you see something in the DS missing from the code, then add the necessary DS code so that it’s available for all future devs (more on this later).
    If it's really not possible for your design to work with DS tokens, then an exception is created:

Exception rules:

    Exceptions need to be justified (a couple of words describing why in this special case the DS tokens were not enough: it’s a unique and single use case, it’s an experiment, etc.), in both the design and the code.
    Exceptions need to be documented: it should be visible for designers and the devs looking (at Figma or the code), that the component uses styling that (exceptionally) don’t exist in the DS.

By following these simple rules is how we manage increasing complexity in design and the code that implements it. Speaking of which…
Translating the Design System into code

Until now we focused on how to start from a list of design tokens and convert into a usable source of truth for the design. Now we’re gonna learn how to translate that source of truth into code. We don’t need the full DS to start this process; this can begin in parallel to the creation of the DS.

The design system is not only a tool for designers, it also needs to be coded as a system

As a developer you’ll enjoy finding the hidden patterns behind the system. Present and discuss the patterns you find with the designer. These discussions will lead to a deeper understanding of the design, which will in turn lead to the best possible code implementation.

We mentioned in part 1 that the tokens will be the quarks that make up the atoms in your Component Library (CL), but since these tokens are now predefined and organised in a system, they can be more than that: all the tokens can be represented as the css utility classes used in your code.
Press enter or click to view image in full size
Sorry for the outdated meme

Turns out the folks at tailwind were on to something when they proposed their utility-first approach. Here we simply propose that your helpers match the design tokens in you DS (which you can also do by overwriting tailwind classes with your token values). The best way to have maintainable css is to need to write as little of it as possible.

When creating these utilities, there’s one consideration I propose all devs to take into account: begin by coding the system, not the components. As devs, we’re incentivised to find the logic or reasoning behind the design decisions, and ideally it’s that logic what ends up in the code. We later use that coded system of utilities to implement the components. This means that devs should always be on the lookout for repeating patters in the token values. And whenever you think you found one, present it and discuss it with the designer. It could be that the designer intuitively applies patterns that he doesn’t realise are there.

Finally, if you’re already leveraging an existing UI library, you should be able overwrite their helpers to have them match the values in your DS (Vuetify has global config, and blueprint APIs for that). This is why in part 1 we proposed to follow an existing naming convention agreed by both the devs and the designers. If you do, both your DS and the way tokens are used in the code will be auto-documented. This means that when a dev codes an atom like this using Vuetify <v-btn class="text-body-2 ma-2 bg-primary-lighten-2"> the typography, the spacing, the colours and everything else will be what's in your DS and not Vuetify's material implementation. This also means that when a dev wants to know what classes he needs to use/implement for a specific token, he can just look for it in the Vuetify docs 👌. If you're writing your css from scratch and have nothing to overwrite, I'd still recommend you use an existing library's naming convention for you helpers to gain these same benefits.

Let’s see an example on how we could implement the Typography tokens in the code.

Typography

We have this list of font-sizes: [11, 13, 16, 21, 24, 38, 46] that pair to this list of line-heights: [14, 17, 20, 26, 29, 46, 56]. I can't find an obvious function that can produce the list of font-sizes. However, it seems that the line-height is calculated from the font-size it pairs with: line-height is the font-size + the ceiling of the 10% of the font-size:

@use 'sass:math';

@function lineHeight($font-size) {
  $percent: $font-size / 10;
  @return $font-size + math.ceil($percent);
}

Check out the full implementation in this codepen. In short, these variables are all you need to be able to produce all your utility classes:

$heading-font-family: "Rokkitt", serif;
$body-font-family: "Roboto", sans;
$sizes: (
  1: 48px,
  2: 36px,
  3: 24px,
  4: 21px,
  5: 16px,
  6: 14px,
  7: 11px
);
$weights: (
regular: 400,
medium: 500,
bold: 700
);

Colors

In a similar fashion we can do something really cool with our colour tokens. All we need is our list of colours:

$colors: (
primary: #259c71,
grey: #919191,
error: #d04c50,
warning: #e9b736
);

And we can use colour functions to automatically create a palette that the designer could use:

@mixin lighten-variants($amount, $percent, $color, $name) {
  @for $i from 1 through $amount {
    .bg-#{$name}-lighten-#{$i} {
      background-color: lighten($color, $percent \* $i);
}

    .text-#{$name}-lighten-#{$i} {
      color: lighten($color, $percent * $i);
    }

}
}
@each $name, $color in $colors {
  .bg-#{$name} { background-color: $color; }
  .text-#{$name} { color: $color; }
  // Lighten
  $l-variants-amount: 3; // Discuss with the designer!
  $l-percent: 10;        // Discuss with the designer!
  @include lighten-variants($l-variants-amount, $l-percent, $color, $name);
}

With very few lines of code you can create all your class tokens and get something like:
![Example of colour class tokens](https://miro.medium.com/v2/resize:fit:864/format:webp/1*p5rCki1uQ81AEkPhU8esBg.png)
Example of colour class tokens

The most important part here is the discussion between devs and designers: devs can show the designer the colour palettes he can create programatically, and decide together the optimal shading and lighting functions and the amount of variants on each side. Check out them colors.tools for inspiration.

A note on layout

We haven’t touched on how to integrate layout tools in the DS. It’s an important topic that deserves its own article. Just know that most design tools have layout features that can be leveraged and "tokenised".

Here’s a 12 column grid with a constant 36px margin in Figma:
![12 column grid with margins](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*5FMrSSto9mDE2uo0JAnIiQ.png)
Press enter or click to view image in full size
12 column grid with margins

Many libraries include grid systems like this that simplify the implementation of complex responsive layouts with css flexbox. You can divide anything into 12 columns and customise margins and gutter.
![Inner grid](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*W6IIaVph3TFosC3I7oX9JQ.png)
Press enter or click to view image in full size
Inner grid

Including this in your DS, understanding it, and using it in the design will greatly simplify its implementation in the code.

A smaller note on spacing

Spacing is also simple to translate into tokens. Define a spacing scale that works for your product (or infer it from existing designs), and create your helper classes to match that scale. Vuetify for example uses increments of 4px and goes from 0 to 16. Having this allows you define all the spaces in your app with helpers like ma-4 px-1 pb-3. This translates to margin all 16px, padding left and padding right 4px, and padding bottom 12px.
Conclusion

Once you have all your token classes, creating atoms, molecules, organisms and any other UI element is a breeze, as long as your team follows the rules. I’ll repeat them here:

    When designing any new UI, always try using available tokens in the DS
    If the new UI needs a token not included in the existing DS, then add the new token in DS.
    Designers: if you notice that the new token doesn’t really match the DS patterns, then try harder to see if you can get your design to work with existing elements.
    Devs: don’t implement anything custom in the UI (no custom sizing, spacing, colour, typography, shadows, etc). If you see something in the DS missing from the class tokens, then add the necessary code for it.
    If it’s really not possible for your design to work with the existing DS tokens, then an exception is created:

Exception rules:

    Exceptions need to be justified (a couple of words describing why in this special case the DS tokens were not enough: it’s a unique and single use case, it’s an experiment, etc.), in both the design and the code.
    Exceptions need to be documented: it should be visible for designers and the devs looking (at Figma or the code), that the component uses styling that (exceptionally) don’t exist in the DS.

If your team follows these simple rules, they’ll be able to produce fast, reliable, consistent UI under every circumstance. Simply looking at a design will provide most of the info the dev needs to exactly replicate it in the code, because the DS tokens used in the design and the classes that will be used in the code match 1-to-1. Your application will contain very little custom css to maintain. Modifying and extending the DS would happen with little to no cost. Prototyping different UIs would be so straightforward that even a design-blind person like me would be able to do it.

I’ll use this last paragraph to give proper recognition to the designers whose teachings and discussions made this article possible:

    Thank you
    Zuzanna Sobiecka
    for the insightful discussions and the valuable tips on how to leverage Figma to make life for developers easier.
    Thank you
    Mickael
    for showing me just how far we can go and how beautiful and complex a design can become with just a small set of tokens.
    Thank you Johanna Dahlroos and Mykyta Lobyntsev for giving my ideas a shot and greatly improving them with your insights

Resources for part 1:

    DS example in Figma: https://www.figma.com/file/jC4daCaV2jsDnAoEaZAa8F/Creating-and-Coding-a-DS?type=design&node-id=103-112&mode=design
    Typography tokens example code implementation: https://codepen.io/blindpupil/pen/QWJMPWp
    Colour tokens example code implementation: https://codepen.io/blindpupil/pen/PoxKKzG?editors=1100
    Step 1: listing your tokens Figma example: https://www.figma.com/file/jC4daCaV2jsDnAoEaZAa8F/Creating-and-Coding-a-DS?type=design&node-id=103-112&mode=design
    Step 2: Organising your tokens Figma example: https://www.figma.com/file/jC4daCaV2jsDnAoEaZAa8F/Creating-and-Coding-a-DS?type=design&node-id=102-48&mode=design
    Step 3: Usable tokens Figma example: https://www.figma.com/file/jC4daCaV2jsDnAoEaZAa8F/Creating-and-Coding-a-DS?type=design&node-id=103-112&mode=design

Design To Code
Design Systems

Cesar Martinez
Written by Cesar Martinez
123 followers
·
3 following

Fullstack dev always on the lookout to learn new tricks
Responses (2)

Write a response

What are your thoughts?
Abhinav Kumar

Abhinav Kumar
he/him

Jul 11, 2023

Reading it , after the Vue.JS meetup, it make more sense, well written. 👌👌

2

刘存杰

刘存杰

Jul 31, 2025

help me a lot! I'm talking about a developer who always struggles with design style when writing page URLs. I used to use it before https://stylespark.dev
It seems to have the same concept as described in the article

More from Cesar Martinez
Domain-Driven Architecture in the Frontend, Part 1
Better Programming

In

Better Programming

by

Cesar Martinez
Domain-Driven Architecture in the Frontend, Part 1
What is Domain Driven Architecture and how it can help you manage complexity in your frontend codebase?
Jun 6, 2022
532
5
Domain-Driven Architecture in the Frontend, Part 2
Better Programming

In

Better Programming

by

Cesar Martinez
Domain-Driven Architecture in the Frontend, Part 2
How your domain code interacts with your frontend application
Jun 6, 2022
324
5
Takes on a simplified OAuth flow with Laravel and Passport
Cesar Martinez

Cesar Martinez
Takes on a simplified OAuth flow with Laravel and Passport
Abstract: this article aims to fill a small gap in official Laravel — Passport documentation for API password authentication in case of…
Nov 27, 2019
3
See all from Cesar Martinez
Recommended from Medium
Scalability in System Design — Interview Notes
Dev

Dev
Scalability in System Design — Interview Notes
Instagram System Design
Aug 27, 2025
Figma + ChatGPT = ❤️
UX Planet

In

UX Planet

by

Nick Babich
Figma + ChatGPT = ❤️
4 Effective Ways of Using Figma in ChatGPT Chat
Jan 13
393
10
Cover: Design Tokens with confidence
UX Collective

In

UX Collective

by

Lukas Oppermann
Design tokens with confidence
Why the W3C design token standard is your new foundation.
Jan 19
116
1
My Journey Building a Design System with Storybook and Tailwind CSS v4
Design Systems Collective

In

Design Systems Collective

by

Aishah Sofea
My Journey Building a Design System with Storybook and Tailwind CSS v4
A tale of refactoring, debugging, and discovering the joys (and pains) of component-driven development
Sep 1, 2025
34
13 Best Design System Examples to Learn From in 2025
Bootcamp

In

Bootcamp

by

Madhesh P
13 Best Design System Examples to Learn From in 2025
In 2025, digital products are everywhere — apps, platforms, and devices are competing for attention. The secret weapon behind seamless…
Sep 23, 2025
1
Building a Scalable Design Token System: From Figma to Code with Style Dictionary
Rahul Maheshwari

Rahul Maheshwari
Building a Scalable Design Token System: From Figma to Code with Style Dictionary
How to create a flexible, vendor-agnostic theming system that scales across multiple brands and platforms
Aug 23, 2025
1
1
See more recommendations

Help

Status

About

Careers

Press

Blog

Privacy

Rules

Terms

Text to speech
