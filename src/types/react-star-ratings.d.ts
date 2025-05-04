declare module 'react-star-ratings' {
  interface StarRatingsProps {
    rating: number;
    starRatedColor: string;
    numberOfStars: number;
    starDimension: string;
    starSpacing: string;
  }

  export default function StarRatings(props: StarRatingsProps): JSX.Element;
}