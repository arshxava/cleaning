import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const services = [
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: 'Standard Clean',
    description:
      'A thorough cleaning of your living space, including dusting, vacuuming, and surface wiping.',
  },
  {
    icon: <WashingMachineIcon className="h-10 w-10 text-primary" />,
    title: 'Deep Clean',
    description:
      'An intensive clean for a fresh start, covering everything from baseboards to ceiling fans.',
  },
  {
    icon: <HomeIcon className="h-10 w-10 text-primary" />,
    title: 'Move-In/Out Clean',
    description:
      'Prepare your new space or ensure you get your deposit back with our comprehensive move-out cleaning.',
  },
];

const testimonials = [
  {
    name: 'Jessica M.',
    school: 'University of Toronto',
    avatar: 'JM',
    review:
      "Campus Clean is a lifesaver! With my hectic study schedule, I barely have time for anything else. They're reliable, professional, and my room has never been cleaner.",
  },
  {
    name: 'David L.',
    school: 'McGill University',
    avatar: 'DL',
    review:
      'The booking process was so easy, and the results were fantastic. I love coming back to a spotless apartment after a long day of classes. Highly recommend!',
  },
  {
    name: 'Sarah K.',
    school: 'UBC',
    avatar: 'SK',
    review:
      "I was skeptical at first, but the quality of service is top-notch. It's affordable for a student budget, and the peace of mind is priceless.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative w-full py-20 md:py-32 lg:py-40 bg-card">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-foreground">
              A Clean Space for a Clear Mind
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-xl text-muted-foreground">
              Campus Clean offers professional, affordable cleaning services
              tailored for Canadian students. Focus on your studies, we’ll handle
              the mess.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/book">
                  Book a Cleaning <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#services">Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://picsum.photos/1600/900"
            alt="Clean and tidy student room"
            data-ai-hint="student room"
            fill
            className="object-cover opacity-10 dark:opacity-5"
          />
        </div>
      </section>

      <section id="how-it-works" className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get your space cleaned in three simple steps.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">1. Book</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Select your building, choose your service, and pick a date and
                  time that works for you.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">2. Clean</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our trusted cleaning professionals arrive on schedule and
                  transform your space.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">3. Relax</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Enjoy a spotless room and the extra free time. It’s that easy!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="services" className="w-full py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Our Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choose the perfect cleaning plan for your needs.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className="flex flex-col">
                <CardHeader className="flex-row items-start gap-4">
                  {service.icon}
                  <div>
                    <CardTitle className="font-headline">
                      {service.title}
                    </CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Loved by Students
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what your peers are saying about Campus Clean.
            </p>
          </div>
          <Carousel
            opts={{ align: 'start' }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1 h-full">
                    <Card className="h-full flex flex-col justify-between">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage
                              src={`https://i.pravatar.cc/40?u=${testimonial.avatar}`}
                            />
                            <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {testimonial.school}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          "{testimonial.review}"
                        </p>
                        <div className="flex mt-4 text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-current" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-primary/10">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
            Ready for a Cleaner Space?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join hundreds of students enjoying a cleaner, more productive living
            environment. Schedule your first cleaning today.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Sign Up Now <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function WashingMachineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h3" />
      <path d="M17 6h.01" />
      <rect width="18" height="20" x="3" y="2" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" />
    </svg>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
