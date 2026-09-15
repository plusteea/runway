const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const CAR_PHOTOS = {
  first: {
    src: asset('/cars/camry.jpg?v=night'),
    model: 'Toyota Camry XV40',
    alt: 'Toyota Camry XV40',
    position: 'center 55%',
  },
  dream: {
    src: asset('/cars/tesla.jpg?v=cover'),
    model: 'Tesla Model 3',
    alt: 'Tesla Model 3',
    position: 'center 58%',
  },
  later: {
    src: asset('/cars/cybertruck.png'),
    model: 'Tesla Cybertruck',
    alt: 'Tesla Cybertruck',
    position: 'center 55%',
  },
  house: {
    src: asset('/cars/house.jpg'),
    model: 'Дом',
    alt: 'Дом',
    position: 'center 50%',
  },
} as const
