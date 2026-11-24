import { Movie } from './movie';

describe('Movie model', () => {
  it('should represent a movie with the expected fields', () => {
    const movie: Movie = {
      id: 'movie-1',
      title: 'Película de prueba',
      synopsis: null,
      duration_minutes: 120,
      poster_url: null,
      release_date: null,
      age_rating: 13,
      is_active: true,
      pre_sale_enabled: false,
      pre_sale_price: null,
    };

    expect(movie.id).toBe('movie-1');
    expect(movie.title).toBe('Película de prueba');
    expect(movie.duration_minutes).toBe(120);
  });
});
