Title: Deep dive | offen
description: offen is a free and open source analytics software for websites and web applications that allows respectful handling of data.
save_as: deep-dive/index.html

### What is this thing called "my data" and why does seemingly everyone want to get hold of it?

It has a ring, gives a slight spine-chilling sensation and generates a whole lot of clicks: consumer magazines like German "Computer Bild" caution about "Google espionage" [^1] just like the internet has countless tutorials on turning off numerous "data leeches" [^2]. Interestingly, diving into these realms will have you accidentally catching the next toolbar, malware infection or even worse [^3].

[^1]: Gegen Google-Spionage wehren <https://www.computerbild.de/artikel/cb-Ratgeber-Kurse-Wissen-Was-weiss-Google-ueber-Sie-2799009.html>
[^2]: Datenkrake Windows 10: So schalten Sie auff&auml;llige Funktionen ab <https://praxistipps.chip.de/datenkrake-windows-10-so-schalten-sie-auffaellige-funktionen-ab_99652>
[^3]: Pick a Download, Any Download! <https://blog.malwarebytes.com/cybercrime/2012/10/pick-a-download-any-download/>

Yet, many internet users still don't know what really is happening to their data. Public relation activities trying to calm the public - as undertaken by Facebook for example [^4] - end up being rather disturbing instead of creating transparency, or adding real value to the public debate. Denelle Dixon, COO of Mozilla, just publicly warned the European Commission [^5] about the dangerous effects an opaque apparatus such as Facebook can have on society. Updated Terms and Conditions only parenthetically mention that newly created Google accounts will now hand over real names to third parties for advertising purposes [^6].

[^4]: Sometimes People Assume Facebook Does Things It Doesn't Do <https://www.zeit.de/digital/datenschutz/2019-01/social-media-facebook-mark-zuckerberg-ads-privacy-business-model-transparency>
[^5]: Mozilla Raises Concerns Over Facebook's Lack of Transparency <https://blog.mozilla.org/blog/2019/01/31/mozilla-raises-concerns-over-facebooks-lack-of-transparency/>
[^6]: Google Has Quietly Dropped Ban on Personally Identifiable Web Tracking <https://www.propublica.org/article/google-has-quietly-dropped-ban-on-personally-identifiable-web-tracking>

As a regular user of the internet, are you really being spied upon? *What exactly is "my data"?* Can a website operator see my name when I'm using it? Does it know about my Email address or my phone number? Does it know which other websites I have been visiting, which search query led me to the site in the first place, what I have recently purchased online, or who I am acquainted with?

> If you have something that you don't want anyone to know, maybe you shouldn't be doing it in the first place. [^7]
>
> Eric Schmidt (at this time CEO of Google), 2009

[^7]: Google CEO Eric Schmidt Dismisses the Importance of Privacy <https://www.eff.org/de/deeplinks/2009/12/google-ceo-eric-schmidt-dismisses-privacy>

We would like to turn the tables on this much quoted statement and apply it to the operators of services and websites instead of their users. The analytics software __offen__ *transparently and uncompromisingly discloses what data is being collected and what it is being used for* to the users.

---

### For users

Visiting a website or using a web application that utilizes __offen__, the user gains access to and ownership of the usage data collected. The cookie used by __offen__ allows viewing all of the associated metrics, the users can *assert themselves what is being collected and what isn't*. Data is being displayed in an accessible and articulate manner and each metric comes with explanations about its usage, relevance and possible privacy implications.

Users can choose to export their data, delete it selectively or in its entirety, or simply opt out of any data collection.

### For operators

Operators of small and mid-sized websites and web applications are faced with growing challenges not only since the introduction of GDPR: how do they gain insights into what users are interested in and which of the features offered are being used? Is it possible to showcase *transparent and considerate handling of user data* - i.e. neither being spy or data leech - without surrendering and abandoning usage metrics altogether?

Choosing __offen__, websites and web applications obtain a free, open and robust tool for collecting and analyzing relevant usage data. The insights gained enable continuous improvement of these services while still respecting their user's privacy. *Opening up the data to the users does not constitute a disadvantage, but strengthens the relationship with them* by being entirely transparent.

### Part of the public debate

Transparently handling usage data in the open creates mutual trust while still enabling operators to collect needed usage statistics. __offen__ is designed to be a mediating agent only, and does not side with either users or operators. Sharing knowledge between the two parties creates opportunities for an *open and fact based discussion* about user data and privacy. Users gain insights into what data is being collected and what these data points are used for, just like they learn about which kind of data is not part of the collection. They are enabled to reach self-determined decisions about what they consent with and what they disagree with when it comes to privacy on the web, also in other contexts than analytics.

We want to exemplify that it is time to depart the age of "data capitalism" [^8] and to create *technologies and infrastructure that are transparent, open and oriented towards the common good*

[^8]: Vielleicht wird in Zukunft auch mit Gewalt um Daten gek&auml;mpft <https://www.zeit.de/digital/datenschutz/2019-01/datenschutz-nick-couldry-datenkolonialismus-datenhandel/komplettansicht>

---

### offen as a technology

At runtime, __offen__ is just mediating exchange between users and operators. Usage data is collected in conformance to GDPR and with the concept of "Datensparsamkeit" [^9] in mind. All user data is encrypted in the browser so that it can only be accessed by the users themselves or the matching operator. While being collected in the context of a website or application, neither operators nor third party scripts have any possibilty to access the usage data. __offen__ itself doesn't have any way of decrypting, processing or even selling the gathered data at any point.

[^9]: Datensparsamkeit <https://martinfowler.com/bliki/Datensparsamkeit.html>

The software itself, as well as *all the used tools are open source*, [project planning][pivotal-tracker]{: target="_blank"} and [technical specification][rfcs-repo]{: target="_blank"} take place in the open and actively solicit feedback from the general public. The infrastructure the service is deployed to is split into three isolated environments in order to minimize possible attack vectors.

[pivotal-tracker]: https://www.pivotaltracker.com/n/projects/2334535
[rfcs-repo]: https://github.com/offen/rfcs

Users and operators are given intuitive and accessibility-focused tools for analyzing and managing their data in the form of a web application and a browser extension. Operators deploy the service using a simple script tag. More sophisticated use cases are covered by a dedicated SDK.

---

### Modus Operandi

Developing and running __offen__ can only work out when it is entirely *free of any kind of economic constraints or goals* and its only objective is *contributing to the common good*. Development of a prototype is reliant on public grants or similar funding sources. Long term operation of the software, just like its maintenance and continued development, is tied to resources granted by foundations or being donated by the public.

### Status Quo

__offen__ is created by [Frederik Ring][frederik-ring]{: target="_blank"} and [Hendrik Niefeld][hendrik-niefeld]{: target="_blank"} and is currently being conceptually designed, both as a product as well as as a software.

We are happy about any kind of feedback. From *criticism and praise to contributions or support*, everything is welcome.

<div class="button-wrapper btn-fill-space">
<a class="btn btn-color-grey" href="../">Summary</a>
<a class="btn btn-color-orange" href="mailto:mail@offen.dev">Contact</a>
</div>

<div class="button-wrapper btn-fill-space">
<a class="btn btn-color-orange" href="https://github.com/offen" target="_blank">Get involved</a>
<a class="btn btn-color-orange" href="https://www.patreon.com/bePatron?u=21484999" target="_blank">Support us</a>
</div>

---

[hendrik-niefeld]: http://niefeld.com/
[frederik-ring]: https://www.frederikring.com/
