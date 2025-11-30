import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    // Fetch the primary image from the backend
    const response = await fetch(`${API_BASE_URL}/files/products/${productId}/images/primary`, {
      headers: {
        // Forward cookies for authentication if needed
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No primary image found, try to get all images and find primary
        try {
          const allImagesResponse = await fetch(`${API_BASE_URL}/files/products/${productId}/images`, {
            headers: {
              cookie: request.headers.get('cookie') || '',
            },
          });
          
          if (allImagesResponse.ok) {
            const allImages = await allImagesResponse.json();
            if (allImages && allImages.length > 0) {
              // Find primary image, or use first image
              const primaryImage = allImages.find((img: any) => img.isPrimary) || allImages[0];
              
              if (primaryImage?.publicId) {
                const imageResponse = await fetch(`${API_BASE_URL}/files/images/${primaryImage.publicId}`, {
                  headers: {
                    cookie: request.headers.get('cookie') || '',
                  },
                });
                
                if (imageResponse.ok) {
                  const imageBuffer = await imageResponse.arrayBuffer();
                  const imageContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                  
                  return new NextResponse(imageBuffer, {
                    status: 200,
                    headers: {
                      'Content-Type': imageContentType,
                      'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                  });
                }
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback image fetch failed:', fallbackError);
        }
        
        // No primary image found, return 404
        return new NextResponse('No primary image found', { status: 404 });
      }
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Check if response is JSON (image metadata) or image file
    if (contentType.includes('application/json')) {
      // Response is JSON with ProductImageResponse
      const data = await response.json();
      console.log('ProductImageResponse:', JSON.stringify(data, null, 2));
      
      // Extract publicId or imageUrl from the response
      const publicId = data.publicId;
      const imageUrl = data.imageUrl;
      
      // Prefer using publicId with the standard image endpoint
      if (publicId) {
        const imageResponse = await fetch(`${API_BASE_URL}/files/images/${publicId}`, {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });
        
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const imageContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
              'Content-Type': imageContentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        } else {
          console.error(`Failed to fetch image with publicId ${publicId}:`, imageResponse.status, imageResponse.statusText);
        }
      }
      
      // Fallback to imageUrl if publicId approach fails
      if (imageUrl) {
        // If imageUrl is a full URL, fetch it directly
        // If it's relative, construct the full URL
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        
        console.log('Fetching image from URL:', fullImageUrl);
        const imageResponse = await fetch(fullImageUrl, {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });
        
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const imageContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
              'Content-Type': imageContentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        } else {
          console.error(`Failed to fetch image from URL ${fullImageUrl}:`, imageResponse.status, imageResponse.statusText);
        }
      }
      
      console.error('No image URL or publicId found in response:', data);
      return new NextResponse('No image URL found in response', { status: 404 });
    } else {
      // Response is directly an image file
      const imageBuffer = await response.arrayBuffer();
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (error) {
    console.error('Error proxying product primary image:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}

