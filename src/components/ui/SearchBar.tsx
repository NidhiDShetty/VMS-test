"use client"
import { Box, Input } from '@chakra-ui/react';
import { ChangeEvent, KeyboardEvent, FC } from 'react';

interface SearchBarProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (query: string) => void;
  // onFilterClick?: () => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

// const FilterIcon = () => (
//   <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M3.75 7H15.75V5H3.75M0.75 0V2H18.75V0M7.75 12H11.75V10H7.75V12Z" fill="white"/>
//   </svg>
// );

const SearchIcon = () => (
  <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.781 16.617L23.064 20.899L21.649 22.314L17.367 18.031C15.7737 19.3082 13.792 20.0029 11.75 20C6.782 20 2.75 15.968 2.75 11C2.75 6.032 6.782 2 11.75 2C16.718 2 20.75 6.032 20.75 11C20.7529 13.042 20.0582 15.0237 18.781 16.617ZM16.775 15.875C18.0441 14.5699 18.7529 12.8204 18.75 11C18.75 7.132 15.617 4 11.75 4C7.882 4 4.75 7.132 4.75 11C4.75 14.867 7.882 18 11.75 18C13.5704 18.0029 15.3199 17.2941 16.625 16.025L16.775 15.875Z" fill="#758195"/>
  </svg>
);

const SearchBar: FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  // onFilterClick,
  placeholder = 'Search Host...',
  size = 'md',
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
    if (e.currentTarget instanceof HTMLInputElement) {
      onSearch(e.currentTarget.value);
    }
  }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: '32px',
          fontSize: 'sm',
          pr: '2.5rem',
          iconRight: '0.5rem',
        };
      case 'lg':
        return {
          height: '56px',
          fontSize: 'lg',
          pr: '4rem',
          iconRight: '1rem',
        };
      default: // md
        return {
          height: '40px',
          fontSize: 'sm',
          pr: '3rem',
          iconRight: '0.75rem',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Box className="flex items-center w-full" maxW={size === 'lg' ? '600px' : '420px'}>
      <Box position="relative" flex="1">
        <Input
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search input"
          tabIndex={0}
          bg="#fff"
          borderRadius="lg"
          border="1px solid #E5E7EB"
          pr={sizeStyles.pr}
          fontSize={sizeStyles.fontSize}
          height={sizeStyles.height}
          color="gray.800"
          _focus={{ borderColor: '#8A38F5', boxShadow: '0 0 0 1.5px #8A38F5' }}
        />
        {/* Search Icon (right) */}
        <Box position="absolute" right={sizeStyles.iconRight} top="50%" transform="translateY(-50%)">
          <SearchIcon />
        </Box>
      </Box>
      {/* {onFilterClick && (
        <Button
          ml={2}
          h="40px"
          w="40px"
          minW="40px"
          bg="#8A38F5"
          _hover={{ bg: '#7a2ee6' }}
          _active={{ bg: '#6c28d9' }}
          borderRadius="md"
          aria-label="Filter"
          tabIndex={0}
          onClick={onFilterClick}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={0}
        >
          <FilterIcon />
        </Button>
      )} */}
    </Box>
  );
};

export default SearchBar; 