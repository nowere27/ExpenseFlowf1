import { useState, useEffect } from 'react';

export const useCountries = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const data = await response.json();
        
        const formattedCountries = data
          .map(country => ({
            name: country.name.common,
            currencies: country.currencies ? Object.keys(country.currencies) : [],
            currencyNames: country.currencies ? Object.values(country.currencies).map(c => c.name) : []
          }))
          .filter(country => country.currencies.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(formattedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading };
};